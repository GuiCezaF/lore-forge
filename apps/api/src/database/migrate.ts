import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { loadEnvironment } from "../config/environment";

async function main() {
  const pool = new Pool({
    connectionString: loadEnvironment().DATABASE_URL,
  });

  const db = drizzle(pool);

  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "drizzle"),
  });

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});