import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { Optional } from '@nestjs/common';

export class UpdateScheduleRequestDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '누나생일',
    description: '제목',
  })
  @IsString()
  @Optional()
  readonly title: string;

  @ApiProperty({
    type: String,
    example: '누나 생일은 10월 6일',
    description: '설명',
  })
  @IsString()
  @Optional()
  readonly description: string;

  @ApiProperty({
    type: String,
    example: '2024-06-10 13:00:00',
    description: '날짜',
  })
  @IsString()
  @Optional()
  readonly date: string;

  @ApiProperty({
    type: [],
    example: ['66a61517670be7ef30b10244', '66a7ae7f25483684cf347cd9'],
    description: '참여자',
  })
  @IsArray()
  @Optional()
  readonly participants: string[];
}
