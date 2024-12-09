import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/createBooking.dto';
import { BookingService } from './booking.service';
import { UpdateBookingDto } from './dto/updateBooking.dto';
import { JwtAuthGuard } from 'src/user/jwt/jwt.guard';
import { CurrentUser } from 'src/user/decorators/currentUser.decorator';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  bookingResponseSchema,
  error403NotAvailableSchema,
  error404Schema,
  bookingsResponseSchema,
  error403NotAuthorSchema,
  bookingDeletedSchema,
  error401NotAuthorizedSchema,
} from './bookingSwaggerSсhema';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiBearerAuth()
  @ApiCreatedResponse({
    description: 'Booking created successfully.',
    schema: bookingResponseSchema,
  })
  @ApiResponse({
    status: 403,
    description: 'Booking is not available for the selected time.',
    schema: error403NotAvailableSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized!',
    schema: error401NotAuthorizedSchema,
  })
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  async createBooking(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.bookingService.createBooking(userId, createBookingDto);
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Booking received successfully.',
    schema: bookingResponseSchema,
  })
  @ApiResponse({
    status: 404,
    description: "Booking doesn't exist.",
    schema: error404Schema,
  })
  async getBookingById(@Param('id') id: number) {
    return await this.bookingService.getBookingById(id);
  }

  @Get()
  @ApiOkResponse({
    description: 'Bookings received successfully.',
    schema: bookingsResponseSchema,
  })
  async getAllBookings() {
    return await this.bookingService.getAllBookings();
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Booking updated successfully.',
    schema: bookingResponseSchema,
  })
  @ApiResponse({
    status: 403,
    description: 'You are not an author.',
    schema: error403NotAuthorSchema,
  })
  @ApiResponse({
    status: 403,
    description: 'Booking is not available for the selected time.',
    schema: error403NotAvailableSchema,
  })
  @ApiResponse({
    status: 404,
    description: "Booking doesn't exist.",
    schema: error404Schema,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized!',
    schema: error401NotAuthorizedSchema,
  })
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  async updateBook(
    @Param('id') id: number,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser('id') userId: number,
  ) {
    return await this.bookingService.updateBooking(
      id,
      updateBookingDto,
      userId,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'Booking deleted successfully.',
    schema: bookingDeletedSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized!',
    schema: error401NotAuthorizedSchema,
  })
  @UseGuards(JwtAuthGuard)
  async deleteBooking(@Param('id') id: number) {
    await this.bookingService.deleteBooking(id);
    return { message: 'Booking deleted successfully.' };
  }
}
