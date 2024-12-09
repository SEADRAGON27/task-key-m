import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/repositories/user.repository';
import { RefreshSessionRepository } from '../user/repositories/refreshSession.repository';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

describe('UserService', () => {
  let service: UserService;
  let mockUserRepository;
  let mockRefreshSessionRepository;
  let mockConfigService;

  beforeEach(async () => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
    };

    mockRefreshSessionRepository = {
      create: jest.fn(),
      deleteByToken: jest.fn(),
      findByToken: jest.fn(),
      deleteById: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
        if (key === 'ACCESS_TOKEN_EXPIRATION_30MINUTES') return 1800;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useValue: mockUserRepository },
        {
          provide: RefreshSessionRepository,
          useValue: mockRefreshSessionRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should throw an exception if passwords do not match', async () => {
      const dto = {
        username: 'testUser',
        email: 'test@example.com',
        password: '12345',
        confirmedPassword: '54321',
      };

      await expect(service.createUser(dto)).rejects.toThrow(
        new HttpException(
          "Password didn't match.",
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
      );
    });

    it('should throw an exception if email or username is taken', async () => {
      mockUserRepository.findByEmail.mockResolvedValueOnce('test@example.com');
      mockUserRepository.findByUsername.mockResolvedValueOnce(null);

      const dto = {
        username: 'testUser',
        email: 'test@example.com',
        password: '12345',
        confirmedPassword: '12345',
      };

      await expect(service.createUser(dto)).rejects.toThrow(
        new HttpException(
          'Name or email is taken.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
      );
    });

    it('should create a user if data is valid', async () => {
      const dto = {
        username: 'testUser',
        email: 'test@example.com',
        password: '12345',
        confirmedPassword: '12345',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({});

      await service.createUser(dto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(
        dto.username,
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          username: dto.username,
          password: expect.any(String),
        }),
      );
    });
  });

  describe('loginUser', () => {
    it('should throw an exception if email is not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValueOnce(null);

      await expect(
        service.loginUser(
          { email: 'test@example.com', password: '12345' },
          'fingerprint123',
        ),
      ).rejects.toThrow(
        new HttpException('User is unfound.', HttpStatus.UNPROCESSABLE_ENTITY),
      );
    });

    it('should throw an exception if password is incorrect', async () => {
      mockUserRepository.findByEmail.mockResolvedValueOnce({
        id: 1,
        password: 'hashedPassword',
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);

      await expect(
        service.loginUser(
          { email: 'test@example.com', password: 'wrongPassword' },
          'fingerprint123',
        ),
      ).rejects.toThrow(
        new HttpException(
          'Password is uncorrect.',
          HttpStatus.UNPROCESSABLE_ENTITY,
        ),
      );
    });

    it('should return user and refresh token on successful login', async () => {
      const user = {
        id: 1,
        username: 'testUser',
        email: 'test@example.com',
        password: 'hashedPassword',
        createdAt: '2024-12-08T14:00:24.701Z',
        updatedAt: '2024-12-08T14:00:24.701Z',
      };

      mockUserRepository.findByEmail.mockResolvedValueOnce(user);

      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);

      jest
        .spyOn(service, 'generateRefreshToken')
        .mockReturnValue('refreshToken123');

      const result = await service.loginUser(
        { email: 'test@example.com', password: '12345' },
        'fingerprint123',
      );

      expect(result).toEqual({
        user: {
          id: 1,
          username: 'testUser',
          email: 'test@example.com',
          createdAt: '2024-12-08T14:00:24.701Z',
          updatedAt: '2024-12-08T14:00:24.701Z',
        },
        refreshToken: 'refreshToken123',
      });

      expect(mockRefreshSessionRepository.create).toHaveBeenCalledWith({
        fingerprint: 'fingerprint123',
        refreshToken: 'refreshToken123',
        userId: 1,
      });
    });
  });

  describe('deleteRefreshSession', () => {
    it('should call deleteByToken from refreshSessionRepository', async () => {
      await service.deleteRefreshSession('refreshToken123');

      expect(mockRefreshSessionRepository.deleteByToken).toHaveBeenCalledWith(
        'refreshToken123',
      );
    });
  });

  describe('refresh', () => {
    it('should throw an exception if refresh token is missing', async () => {
      await expect(service.refresh(null, 'fingerprint123')).rejects.toThrow(
        new HttpException('Not authorized!', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should throw an exception if session is not found', async () => {
      mockRefreshSessionRepository.findByToken.mockResolvedValueOnce(null);

      await expect(
        service.refresh('invalidToken', 'fingerprint123'),
      ).rejects.toThrow(
        new HttpException('Not authorized!', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should return new tokens if valid refresh session and token', async () => {
      const refreshSession = {
        id: 1,
        refreshToken: 'refreshToken',
        fingerprint: 'fingerprint123',
        userId: 1,
      };

      const user = {
        id: 1,
        username: 'testUser',
        email: 'test@example.com',
        createdAt: '2024-12-08T14:00:24.701Z',
        updatedAt: '2024-12-08T14:00:24.701Z',
      };

      mockRefreshSessionRepository.findByToken.mockResolvedValueOnce(
        refreshSession,
      );
      jest
        .spyOn(jwt, 'verify')
        .mockImplementationOnce((token: string, secret: string) => {
          return { username: 'testUser' };
        });

      mockUserRepository.findByUsername.mockResolvedValueOnce(user);
      jest
        .spyOn(service, 'generateAccessToken')
        .mockReturnValue('newAccessToken123');
      jest
        .spyOn(service, 'generateRefreshToken')
        .mockReturnValue('newRefreshToken123');

      const result = await service.refresh('validToken', 'fingerprint123');

      expect(result).toEqual({
        accessToken: 'newAccessToken123',
        refreshToken: 'newRefreshToken123',
        tokenExpiration: 1800,
      });

      expect(mockRefreshSessionRepository.deleteById).toHaveBeenCalledWith(
        refreshSession.id,
      );
      expect(mockRefreshSessionRepository.create).toHaveBeenCalledWith({
        fingerprint: 'fingerprint123',
        refreshToken: 'newRefreshToken123',
        userId: 1,
      });
    });
  });
});
