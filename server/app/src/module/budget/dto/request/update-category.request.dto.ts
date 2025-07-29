import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryRequestDto {
  @ApiProperty({ description: '카테고리 이름', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '아이콘', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: '색상', required: false })
  @IsString()
  @IsOptional()
  color?: string;
}
