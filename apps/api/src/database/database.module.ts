import {
  Global,
  Inject,
  Injectable,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getEnvironment } from '../config/environment';
import { DATABASE, DATABASE_POOL } from './database.constants';
import * as schema from './schema';

@Injectable()
class DatabaseShutdownService implements OnModuleDestroy {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      useFactory: () => {
        return new Pool({ connectionString: getEnvironment().DATABASE_URL });
      },
    },
    {
      provide: DATABASE,
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
      inject: [DATABASE_POOL],
    },
    DatabaseShutdownService,
  ],
  exports: [DATABASE, DATABASE_POOL],
})
export class DatabaseModule {}
