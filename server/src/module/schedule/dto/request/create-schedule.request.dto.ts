import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString
} from 'class-validator';

class TagDto {
  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export enum RepeatType {
  NONE = 'none',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export class CreateScheduleRequestDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '누나생일',
    description: '제목'
  })
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({
    type: String,
    example: '누나 생일은 10월 6일',
    description: '설명'
  })
  @IsString()
  readonly memo: string;

  @ApiProperty({
    type: String,
    example: '2025-01-10 13:00:00',
    description: '시작 날짜'
  })
  @IsString()
  @IsNotEmpty()
  readonly start_date: string;

  @ApiProperty({
    type: String,
    example: '2025-01-11 13:00:00',
    description: '종료 날짜'
  })
  @IsString()
  readonly end_date: string;

  @ApiProperty({
    type: String,
    example: '2025-01-11 13:00:00',
    description: '종료 날짜'
  })
  @IsEnum(RepeatType)
  readonly repeat_type: RepeatType;

  // @ApiProperty({
  //   type: String,
  //   example: '2025-01-11 13:00:00',
  //   description: '알람 날짜'
  // })
  // @IsString()
  // readonly alarm_date: string;

  @ApiProperty({
    type: [],
    example: ['66a61517670be7ef30b10244', '66a7ae7f25483684cf347cd9'],
    description: '참여자'
  })
  @IsArray()
  @IsNotEmpty()
  readonly participants: string[];

  // @ApiProperty({
  //   type: Array,
  //   example: [
  //     {
  //       color: 'red',
  //       name: '가족'
  //     },
  //     {
  //       color: 'blue',
  //       name: '유진쨩'
  //     }
  //   ],
  //   description: '태그'
  // })
  // readonly tags: TagDto[];

  @ApiProperty({
    type: Boolean,
    example: false,
    description: '기념일 여부'
  })
  @IsBoolean()
  @IsNotEmpty()
  readonly is_anniversary: boolean;
}
