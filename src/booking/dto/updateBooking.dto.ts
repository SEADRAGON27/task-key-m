import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateBookingDto {
  @ApiProperty({
    example: '2024-12-09',
  })
  @IsDateString({ strict: true, strictSeparator: true })
  @IsOptional()
  date?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in the format HH:mm',
  })
  @IsOptional()
  startTime?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in the format HH:mm',
  })
  @IsOptional()
  endTime?: string;
}
