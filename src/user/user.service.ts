import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { compare, hash } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { User, UserResponse } from './type/user.type';
import { LoginUserDto } from './dto/loginUser.dto';
import { ConfigService } from '@nestjs/config';
import { AuthTokens } from './type/authTokens.type';
import { UserRepository } from './repositories/user.repository';
import { RefreshSessionRepository } from './repositories/refreshSession.repository';

@Injectable()
export class UserService {
  private jwtRefreshSecret: string;
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshSessionRepository: RefreshSessionRepository,
    private readonly configService: ConfigService,
  ) {
    this.jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');
  }

  async createUser(createUserDto: CreateUserDto) {
    if (createUserDto.confirmedPassword !== createUserDto.password)
      throw new HttpException(
        "Password didn't match.",
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

    const userByEmail = await this.userRepository.findByEmail(
      createUserDto.email,
    );

    const userByName = await this.userRepository.findByUsername(
      createUserDto.username,
    );

    if (userByEmail || userByName)
      throw new HttpException(
        'Name or email is taken.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

    createUserDto.password = await hash(createUserDto.password, 10);

    await this.userRepository.create(createUserDto);
  }

  async loginUser(loginUserDto: LoginUserDto, fingerprint: string) {
    const userByEmail = await this.userRepository.findByEmail(
      loginUserDto.email,
    );

    if (!userByEmail)
      throw new HttpException(
        'User is unfound.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

    const isPassword = await compare(
      loginUserDto.password,
      userByEmail.password,
    );

    if (!isPassword)
      throw new HttpException(
        'Password is uncorrect.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );

    const refreshToken = this.generateRefreshToken(userByEmail);

    await this.refreshSessionRepository.create({
      fingerprint,
      refreshToken,
      userId: userByEmail.id,
    });

    const { password, ...user } = userByEmail;
    return { user, refreshToken };
  }

  buildUserResponse(user: User): UserResponse {
    return {
      user: {
        ...user,
        token: this.generateAccessToken(user),
        tokenExpiration: +this.configService.get<number>(
          'ACCESS_TOKEN_EXPIRATION_30MINUTES',
        ),
      },
    };
  }

  generateRefreshToken(user: User): string {
    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      this.jwtRefreshSecret,
      { expiresIn: '15d' },
    );
  }

  generateAccessToken(user: User): string {
    const jwtAccessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');

    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      jwtAccessSecret,
      { expiresIn: '30m' },
    );
  }

  async deleteRefreshSession(refreshToken: string) {
    await this.refreshSessionRepository.deleteByToken(refreshToken);
  }

  async refresh(
    currentRefreshToken: string,
    fingerprint: string,
  ): Promise<AuthTokens> {
    if (!currentRefreshToken)
      throw new HttpException('Not authorized!', HttpStatus.UNAUTHORIZED);

    const refreshSession =
      await this.refreshSessionRepository.findByToken(currentRefreshToken);

    if (!refreshSession)
      throw new HttpException('Not authorized!', HttpStatus.UNAUTHORIZED);

    if (refreshSession.fingerprint !== fingerprint)
      throw new HttpException('Forbidden.', HttpStatus.FORBIDDEN);

    let payload;

    try {
      payload = verify(currentRefreshToken, this.jwtRefreshSecret);
    } catch (err) {
      throw new HttpException('Forbidden.', HttpStatus.FORBIDDEN);
    }

    await this.refreshSessionRepository.deleteById(refreshSession.id);

    const user = await this.userRepository.findByUsername(payload.username);

    const accessToken: string = this.generateAccessToken(user);
    const refreshToken: string = this.generateRefreshToken(user);

    await this.refreshSessionRepository.create({
      fingerprint,
      refreshToken,
      userId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      tokenExpiration: this.configService.get<number>(
        'ACCESS_TOKEN_EXPIRATION_30MINUTES',
      ),
    };
  }
}
