import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateUserDto } from './dto/createUser.dto';
import { Fingerprint, IFingerprint } from 'nestjs-fingerprint';
import { LoginUserDto } from './dto/loginUser.dto';
import { ConfigService } from '@nestjs/config';
import { Cookie } from './decorators/cookies.decorator';
import { Response } from 'express';
import { UserService } from './user.service';
import { JwtAuthGuard } from './jwt/jwt.guard';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  error401NotAuthorizedSchema,
  error403ForbiddenSchema,
  error422ToCreateUserSchema,
  error422ToLogInUserSchema,
  refreshResponseSchema,
  userCreatedSchema,
  userResponseShema,
} from './userSwaggerSchema';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiCreatedResponse({
    description: 'User created successfully.',
    schema: userCreatedSchema,
  })
  @ApiResponse({
    status: 422,
    description:
      "Exceptions: 1)Password didn't match. 2)Name or email is taken.",
    schema: error422ToCreateUserSchema,
  })
  @UsePipes(new ValidationPipe())
  async createUser(@Body() createUserDto: CreateUserDto) {
    await this.userService.createUser(createUserDto);
    return { message: 'You are registrated.' };
  }

  @Post('login')
  @ApiOkResponse({
    description: 'User logged in successfully.',
    schema: userResponseShema,
  })
  @ApiResponse({
    status: 422,
    description: 'Exceptions: 1)User is unfound. 2)Password is uncorrect.',
    schema: error422ToLogInUserSchema,
  })
  @HttpCode(200)
  @UsePipes(new ValidationPipe())
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Fingerprint() fingerprint: IFingerprint,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, refreshToken } = await this.userService.loginUser(
      loginUserDto,
      fingerprint.id,
    );
    const userResponse = this.userService.buildUserResponse(user);

    res.cookie('REFRESH_TOKEN', refreshToken, {
      httpOnly: true,
      //secure:true,
      sameSite: 'strict',
      maxAge: this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_15DAYS'),
    });

    return userResponse;
  }
  @Post('logout')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'User is logged out.' })
  @ApiResponse({
    status: 401,
    description: 'Not authorized!',
    schema: error401NotAuthorizedSchema,
  })
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logOut(
    @Cookie('REFRESH_TOKEN') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.userService.deleteRefreshSession(refreshToken);

    res.status(200).clearCookie('REFRESH_TOKEN');
  }

  @Get('refresh')
  @ApiOkResponse({
    description: 'Tokens are updated.',
    schema: refreshResponseSchema,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden.',
    schema: error403ForbiddenSchema,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authorized!',
    schema: error401NotAuthorizedSchema,
  })
  async refresh(
    @Cookie('REFRESH_TOKEN') refresh_Token: string,
    @Fingerprint() fingerprint: IFingerprint,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, tokenExpiration, refreshToken } =
      await this.userService.refresh(refresh_Token, fingerprint.id);

    res.cookie('REFRESH_TOKEN', refreshToken, {
      httpOnly: true,
      //secure:true,
      sameSite: 'strict',
      maxAge: this.configService.get<number>('REFRESH_TOKEN_EXPIRATION_15DAYS'),
    });

    return { accessToken, tokenExpiration };
  }
}
