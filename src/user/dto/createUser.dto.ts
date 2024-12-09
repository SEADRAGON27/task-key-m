import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'nikita',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

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

  @ApiProperty({
    example: '1',
  })
  @IsString()
  @IsNotEmpty()
  confirmedPassword: string;
}
