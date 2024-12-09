import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    example: 'nikita@gmail.com',
  })
  @IsEmail({}, { message: 'Email must be a valid.' })
  email: string;

  @ApiProperty({
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
