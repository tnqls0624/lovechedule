import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateWorkspaceRequestDto {
  @ApiProperty({
    example: '우리들의 다이어리',
    description: '워크스페이스 이름',
  })
  @IsString()
  readonly title: string;

  @ApiProperty({
    example: '2024-01-01',
    description: '사귀기 시작한 날짜',
  })
  @IsString()
  readonly love_day: string;
}
