import { Module } from '@nestjs/common';
import { MigrationBootstrapService } from './migration-bootstrap.service';

@Module({
  providers: [MigrationBootstrapService],
  exports: [MigrationBootstrapService],
})
export class DatabaseModule {}
