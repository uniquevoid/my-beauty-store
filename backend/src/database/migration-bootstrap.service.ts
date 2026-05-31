import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { applyPendingMigrations, isAutoMigrateEnabled } from './migration-runner';

@Injectable()
export class MigrationBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(MigrationBootstrapService.name);

  async onModuleInit() {
    if (!isAutoMigrateEnabled()) {
      this.logger.log('AUTO_DB_MIGRATE is disabled; skipping database migrations.');
      return;
    }

    if (!process.env.DATABASE_URL?.trim()) {
      this.logger.warn(
        'DATABASE_URL is not set; skipping automatic migrations. Set it to enable schema sync on startup.',
      );
      return;
    }

    try {
      const ran = await applyPendingMigrations();
      if (ran.length) {
        this.logger.log(`Applied ${ran.length} database migration(s): ${ran.join(', ')}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database migration failed: ${message}`);
      throw error;
    }
  }
}
