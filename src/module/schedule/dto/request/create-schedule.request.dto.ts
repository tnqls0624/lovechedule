import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class TagDto {
  @IsString()
  @IsNotEmpty()
  color: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateScheduleRequestDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '누나생일',
    description: '제목',
  })
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({
    type: String,
    example: '누나 생일은 10월 6일',
    description: '설명',
  })
  @IsString()
  readonly description: string;

  @ApiProperty({
    type: String,
    example: '2024-06-10 13:00:00',
    description: '날짜',
  })
  @IsString()
  @IsNotEmpty()
  readonly date: string;

  @ApiProperty({
    type: [],
    example: ['66a61517670be7ef30b10244', '66a7ae7f25483684cf347cd9'],
    description: '참여자',
  })
  @IsArray()
  @IsNotEmpty()
  readonly participants: string[];

  @ApiProperty({
    type: Array,
    example: [
      {
        color: 'red',
        name: '가족',
      },
      {
        color: 'blue',
        name: '유진쨩',
      },
    ],
    description: '태그',
  })
  readonly tags: TagDto[];
}
