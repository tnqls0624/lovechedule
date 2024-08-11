import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAnniversaryRequestDto {
  @ApiProperty({
    example: '100일 여행',
    description: '기념일 이름'
  })
  @IsString()
  readonly title: string;

  @ApiProperty({
    example: '무슨 날인가',
    description: '내용'
  })
  @IsString()
  readonly description: string;

  @ApiProperty({
    example: '2024-09-30',
    description: '날짜'
  })
  @IsString()
  readonly date: string;
}
