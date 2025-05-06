import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsString } from 'class-validator';
import { Optional } from '@nestjs/common';
import { RepeatType } from './create-schedule.request.dto';

export class UpdateScheduleRequestDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '누나생일',
    description: '제목'
  })
  @IsString()
  @Optional()
  readonly title: string;

  @ApiProperty({
    type: String,
    example: '누나 생일은 10월 6일',
    description: '설명'
  })
  @IsString()
  @Optional()
  readonly memo: string;

  @ApiProperty({
    type: String,
    example: '2025-01-10 13:00:00',
    description: '날짜'
  })
  @IsString()
  @Optional()
  readonly start_date: string;

  @ApiProperty({
    type: String,
    example: '2025-01-11 13:00:00',
    description: '날짜'
  })
  @IsString()
  @Optional()
  readonly end_date: string;

  @ApiProperty({
    type: String,
    example: '2025-01-11 13:00:00',
    description: '날짜'
  })
  @IsString()
  @Optional()
  readonly alarm_date: string;

  @ApiProperty({
    type: String,
    example: RepeatType.MONTHLY,
    description: '종료 날짜'
  })
  @IsEnum(RepeatType)
  @Optional()
  readonly repeat_type: RepeatType;

  @ApiProperty({
    type: [],
    example: ['66a61517670be7ef30b10244', '66a7ae7f25483684cf347cd9'],
    description: '참여자'
  })
  @IsArray()
  @Optional()
  readonly participants: string[];

  @ApiProperty({
    type: Boolean,
    example: false,
    description: '기념일 여부'
  })
  @IsBoolean()
  @Optional()
  readonly is_anniversary: boolean;

  @ApiProperty({
    type: String,
    example: 'solar',
    description: '양력, 음력'
  })
  @Optional()
  readonly calendar_type: 'solar' | 'lunar';
}
