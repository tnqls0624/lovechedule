import { ApiProperty } from '@nestjs/swagger';

export class UploadImageRequestDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: '이미지 파일'
  })
  file: Buffer;
}