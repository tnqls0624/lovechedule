import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { Tag } from '../../schema/workspace.schema';

export class UpdateWorkspaceRequestDto {
  @ApiProperty({
    example: '2024-01-01',
    description: '사귀기 시작한 날짜'
  })
  @IsString()
  @IsOptional()
  readonly love_day: string;

  @ApiProperty({
    example: [
      {
        _id: 'asdsda',
        name: '숩'
      }
    ],
    description: '유저 이름 및 아이디'
  })
  @IsOptional()
  readonly users: any[];

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
  @IsOptional()
  readonly tags: Tag;

  @ApiProperty({
    example: 'http://test.com/image',
    description: '썸네일 이미지'
  })
  @IsString()
  @IsOptional()
  readonly thumbnail_image: string;
}
