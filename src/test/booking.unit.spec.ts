import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from '../booking/booking.service';
import { BookingRepository } from '../booking/booking.repository';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('BookingService', () => {
  let service: BookingService;
  let repository: BookingRepository;

  const mockBookingRepository = {
    checkAvailability: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    checkAvailabilityForUpdate: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: BookingRepository,
          useValue: mockBookingRepository,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    repository = module.get<BookingRepository>(BookingRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    it('should throw a forbidden exception if booking is not available', async () => {
      mockBookingRepository.checkAvailability.mockResolvedValue(false);

      await expect(
        service.createBooking(1, {
          date: '2024-11-23',
          startTime: '10:00',
          endTime: '12:00',
        }),
      ).rejects.toThrow(
        new HttpException(
          'Booking is not available for the selected time.',
          HttpStatus.FORBIDDEN,
        ),
      );

      await expect(
        service.createBooking(1, {
          date: '2024-11-23',
          startTime: '10:00',
          endTime: '09:00',
        }),
      ).rejects.toThrow(
        new HttpException(
          'Booking is not available for the selected time.',
          HttpStatus.FORBIDDEN,
        ),
      );
    });

    it('should create a booking if available', async () => {
      const createBookingDto = {
        date: '2024-11-23',
        startTime: '10:00',
        endTime: '12:00',
      };
      mockBookingRepository.checkAvailability.mockResolvedValue(true);
      mockBookingRepository.create.mockResolvedValue({
        id: 1,
        ...createBookingDto,
        userId: 1,
        createdAt: '2024-12-08T12:00:24.701Z',
        updatedAt: '2024-12-08T12:00:24.701Z',
      });

      const result = await service.createBooking(1, createBookingDto);

      expect(result).toEqual({
        id: 1,
        ...createBookingDto,
        userId: 1,
        createdAt: '2024-12-08T12:00:24.701Z',
        updatedAt: '2024-12-08T12:00:24.701Z',
      });
      expect(mockBookingRepository.create).toHaveBeenCalledWith(
        createBookingDto,
        1,
      );
    });
  });

  describe('updateBookingById', () => {
    it('should throw a not found exception if booking does not exist', async () => {
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateBooking(1, { startTime: '10:00' }, 1),
      ).rejects.toThrow(
        new HttpException("Booking doesn't exist.", HttpStatus.NOT_FOUND),
      );
    });

    it('should throw a forbidden exception if user is not the author', async () => {
      mockBookingRepository.findById.mockResolvedValue({ userId: 2 });

      await expect(
        service.updateBooking(1, { startTime: '10:00' }, 1),
      ).rejects.toThrow(
        new HttpException('You are not an author.', HttpStatus.FORBIDDEN),
      );
    });

    it('should throw a forbidden exception if updated booking time is not available', async () => {
      const booking = {
        id: 1,
        date: '2024-11-24',
        startTime: '10:00',
        endTime: '12:00',
        userId: 1,
        createdAt: '2024-12-08T12:00:24.701Z',
        updatedAt: '2024-12-08T12:00:24.701Z',
      };
      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.checkAvailabilityForUpdate.mockResolvedValue(false);

      await expect(
        service.updateBooking(1, { startTime: '09:00' }, 1),
      ).rejects.toThrow(
        new HttpException(
          'Booking is not available for the selected time.',
          HttpStatus.FORBIDDEN,
        ),
      );
    });

    it('should update booking if all conditions are met', async () => {
      const booking = {
        id: 1,
        date: '2024-11-24',
        startTime: '10:00',
        endTime: '12:00',
        userId: 1,
        createdAt: '2024-12-08T12:00:24.701Z',
        updatedAt: '2024-12-08T12:00:24.701Z',
      };
      const updateBookingDto = { startTime: '11:00' };

      mockBookingRepository.findById.mockResolvedValue(booking);
      mockBookingRepository.checkAvailabilityForUpdate.mockResolvedValue(true);
      mockBookingRepository.update.mockResolvedValue({
        id: 1,
        date: '2024-11-24',
        ...updateBookingDto,
        endTime: '12:00',
        userId: 1,
        createdAt: '2024-12-08T12:00:24.701Z',
        updatedAt: '2024-12-08T13:00:24.701Z',
      });

      const result = await service.updateBooking(1, updateBookingDto, 1);

      expect(result).toEqual({
        id: 1,
        date: '2024-11-24',
        ...updateBookingDto,
        endTime: '12:00',
        userId: 1,
        createdAt: '2024-12-08T12:00:24.701Z',
        updatedAt: '2024-12-08T13:00:24.701Z',
      });
      expect(mockBookingRepository.update).toHaveBeenCalledWith(
        updateBookingDto,
        1,
      );
    });
  });

  describe('getBookingById', () => {
    it('should throw a not found exception if booking does not exist', async () => {
      mockBookingRepository.findById.mockResolvedValue(null);

      await expect(service.getBookingById(1)).rejects.toThrow(
        new HttpException("Booking doesn't exist.", HttpStatus.NOT_FOUND),
      );
    });

    it('should return the booking if it exists', async () => {
      const booking = {
        id: 1,
        date: '2024-11-24',
        startTime: '11:00',
        endTime: '12:00',
        userId: 1,
        createdAt: '2024-12-08T12:00:24.701Z',
        updatedAt: '2024-12-08T13:00:24.701Z',
      };
      mockBookingRepository.findById.mockResolvedValue(booking);

      const result = await service.getBookingById(1);

      expect(result).toEqual(booking);
    });
  });

  describe('getAllBookings', () => {
    it('should return all bookings', async () => {
      const bookings = [
        {
          id: 1,
          date: '2024-11-24',
          startTime: '11:00',
          endTime: '12:00',
          userId: 1,
          createdAt: '2024-12-08T12:00:24.701Z',
          updatedAt: '2024-12-08T13:00:24.701Z',
        },
        {
          id: 2,
          date: '2024-11-24',
          startTime: '13:00',
          endTime: '14:00',
          userId: 1,
          createdAt: '2024-12-08T14:00:24.701Z',
          updatedAt: '2024-12-08T14:00:24.701Z',
        },
      ];
      mockBookingRepository.findAll.mockResolvedValue(bookings);

      const result = await service.getAllBookings();

      expect(result).toEqual(bookings);
    });
  });

  describe('deleteBooking', () => {
    it('should throw a not found exception if booking does not exist', async () => {
      mockBookingRepository.delete.mockResolvedValue(null);

      await expect(service.deleteBooking(1)).rejects.toThrow(
        new HttpException("Booking doesn't exist.", HttpStatus.NOT_FOUND),
      );
    });

    it('should delete the booking if it exists', async () => {
      mockBookingRepository.delete.mockResolvedValue({ id: 1 });

      await service.deleteBooking(1);

      expect(mockBookingRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
