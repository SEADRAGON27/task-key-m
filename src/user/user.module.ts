import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './repositories/user.repository';
import { RefreshSessionRepository } from './repositories/refreshSession.repository';
import { JwtAuthGuard } from './jwt/jwt.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getJWTConfig } from './jwt/jwt.config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJWTConfig,
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    RefreshSessionRepository,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [UserRepository, RefreshSessionRepository, JwtAuthGuard],
})
export class UserModule {}
