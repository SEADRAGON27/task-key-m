import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: '2024-12-09',
  })
  @IsDateString({ strict: true, strictSeparator: true })
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: '11:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in the format HH:mm',
  })
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    example: '11:50',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in the format HH:mm',
  })
  @IsNotEmpty()
  endTime: string;
}
