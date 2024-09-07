import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAlbumRequestDto {
  @ApiProperty({
    type: String,
    required: true,
    example: '누나생일',
    description: '제목'
  })
  @IsString()
  @IsNotEmpty()
  readonly title: string;
}
