import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingRepository } from './booking.repository';
import { JwtAuthGuard } from 'src/user/jwt/jwt.guard';

@Module({
  imports: [],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository, JwtAuthGuard],
  exports: [BookingRepository],
})
export class BookingModule {}
