import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateInfoRequestDto {
  @ApiProperty({
    example: '수무무',
    description: '사용할 이름',
  })
  @IsString()
  readonly name: string;
}
