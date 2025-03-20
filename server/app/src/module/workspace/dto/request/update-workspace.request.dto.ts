import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateWorkspaceRequestDto {
  @ApiProperty({
    example: '2024-01-01',
    description: '사귀기 시작한 날짜'
  })
  @IsString()
  @IsOptional()
  readonly love_day: string;

  @ApiProperty({
    example: [{
      _id: 'asdsda',
      name: '숩'
    }],
    description: '유저 이름 및 아이디'
  })
  @IsOptional()
  readonly users: any[];

  @ApiProperty({
    example: {
      aniversary: '🎉',
      together: '👩‍❤️‍👨'
    },
    description: '이모지'
  })
  @IsObject()
  @IsOptional()
  readonly emoji: object;

  @ApiProperty({
    example: 'http://test.com/image',
    description: '썸네일 이미지'
  })
  @IsString()
  @IsOptional()
  readonly thumbnail_image: string;
}
