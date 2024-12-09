import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';
import { NestjsFingerprintModule } from 'nestjs-fingerprint';
import { UserModule } from './user/user.module';
import { DbInit } from './db/dbInit';
import { DatabaseModule } from './db/db.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BookingModule,
    DatabaseModule,
    UserModule,
    NestjsFingerprintModule.forRoot({
      params: ['headers', 'userAgent'],
    }),
  ],
  controllers: [],
  providers: [ConfigService, DbInit],
})
export class AppModule {}
