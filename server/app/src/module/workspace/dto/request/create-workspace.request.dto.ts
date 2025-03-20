import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class CreateWorkspaceRequestDto {
  @ApiProperty({
    example: 'ASD213',
    description: '초대코드'
  })
  @IsString()
  readonly invite_code: string;

  @ApiProperty({
    example: '2024-01-01',
    description: '사귀기 시작한 날짜'
  })
  @IsString()
  readonly love_day: string;

  @ApiProperty({
    example: {
      aniversary: '🎉',
      together: '👩‍❤️‍👨'
    },
    description: '이모지'
  })
  @IsObject()
  readonly emoji: object;

  @ApiProperty({
    example: 'http://test.com/image',
    description: '썸네일 이미지'
  })
  @IsString()
  readonly thumbnail_image: string;
}
