import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import { loadEnvironment } from '../config/environment';

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id text PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query<{ id: string }>(
    'SELECT id FROM __drizzle_migrations ORDER BY id ASC',
  );
  return new Set(result.rows.map((row) => row.id));
}

async function migrate(): Promise<void> {
  const connectionString = loadEnvironment().DATABASE_URL;

  const pool = new Pool({ connectionString });
  const migrationsDir = path.resolve(process.cwd(), 'drizzle');
  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  try {
    await ensureMigrationsTable(pool);
    const applied = await getAppliedMigrations(pool);

    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }

      const sql = await readFile(path.join(migrationsDir, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO __drizzle_migrations (id) VALUES ($1)',
          [file],
        );
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
