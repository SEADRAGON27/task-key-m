import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBookingDto } from './dto/createBooking.dto';
import { BookingRepository } from './booking.repository';
import { UpdateBookingDto } from './dto/updateBooking.dto';
import { Booking } from './booking.type';

@Injectable()
export class BookingService {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async createBooking(userId: number, createBookingDto: CreateBookingDto):Promise<Booking> {
    const isBookingAvailable =
      await this.bookingRepository.checkAvailability(createBookingDto);

    if (!isBookingAvailable)
      throw new HttpException(
        'Booking is not available for the selected time.',
        HttpStatus.FORBIDDEN,
      );

    return await this.bookingRepository.create(createBookingDto, userId);
  }

  async updateBooking(
    id: number,
    updateBookingDto: UpdateBookingDto,
    userId: number,
  ): Promise<Booking>{
    const booking = await this.bookingRepository.findById(id);

    if (!booking)
      throw new HttpException("Booking doesn't exist.", HttpStatus.NOT_FOUND);

    if (booking.userId !== userId)
      throw new HttpException('You are not an author.', HttpStatus.FORBIDDEN);

    Object.assign(booking, updateBookingDto);

    const isBookingAvailable = await this.bookingRepository.checkAvailabilityForUpdate(booking);

    if (!isBookingAvailable)
      throw new HttpException(
        'Booking is not available for the selected time.',
        HttpStatus.FORBIDDEN,
      );

    return await this.bookingRepository.update(updateBookingDto, id);
  }

  async getBookingById(id: number):Promise<Booking> {
    const booking = await this.bookingRepository.findById(id);

    if (!booking)
      throw new HttpException("Booking doesn't exist.", HttpStatus.NOT_FOUND);

    return booking;
  }

  async getAllBookings():Promise<Booking[]> {
    return this.bookingRepository.findAll();
  }

  async deleteBooking(id: number) {
    const booking = await this.bookingRepository.delete(id);

    if (!booking)
      throw new HttpException("Booking doesn't exist.", HttpStatus.NOT_FOUND);
  }
}
