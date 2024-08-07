import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTagRequestDto {
  @ApiProperty({
    example: '유진쨩',
    description: '태그 이름',
  })
  @IsString()
  readonly name: string;

  @ApiProperty({
    example: 'red',
    description: '태그 색깔',
  })
  @IsString()
  readonly color: string;
}
