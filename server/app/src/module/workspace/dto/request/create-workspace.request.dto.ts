import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';
import { Tag } from '../../schema/workspace.schema';

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
      anniversary: { name: '기념일', color: '#FF0000' },
      together: { name: '함께', color: '#00FF00' },
      guest: { name: '상대방', color: '#0000FF' },
      master: { name: '나', color: '#FF00FF' }
    },
    description: '태그'
  })
  @IsObject()
  readonly tags: Tag;

  @ApiProperty({
    example: 'http://test.com/image',
    description: '썸네일 이미지'
  })
  @IsString()
  readonly thumbnail_image: string;
}
