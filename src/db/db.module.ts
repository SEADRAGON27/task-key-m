import { Module, Global } from '@nestjs/common';
import { DatabaseConfig } from './db.config';

@Global()
@Module({
  providers: [DatabaseConfig],
  exports: [DatabaseConfig],
})
export class DatabaseModule {}
