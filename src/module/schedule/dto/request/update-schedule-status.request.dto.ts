import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { Optional } from '@nestjs/common';

export class UpdateScheduleStatusRequestDto {
  @ApiProperty({
    type: Boolean,
    required: true,
    example: false,
    description: '끝났는가'
  })
  @IsBoolean()
  @Optional()
  readonly is_done: boolean;
}
