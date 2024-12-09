import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { BookingRepository } from '../booking/booking.repository';
import { UserRepository } from 'src/user/repositories/user.repository';
import { RefreshSessionRepository } from 'src/user/repositories/refreshSession.repository';
import { DatabaseConfig } from './db.config';

@Injectable()
export class DbInit implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly userRepository: UserRepository,
    private readonly refreshsessionRepository: RefreshSessionRepository,
    private readonly databaseConfig: DatabaseConfig,
  ) {}

  async onModuleInit() {
    console.log('Initializing repositories in sequence.');
    await this.userRepository.createTable();
    await this.refreshsessionRepository.createTable();
    await this.bookingRepository.createTable();
    console.log('All tables created.');
  }

  async onModuleDestroy() {
    await this.databaseConfig.end();
    console.log('Database connection closed');
  }
}
