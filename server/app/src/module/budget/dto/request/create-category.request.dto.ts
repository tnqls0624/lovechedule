import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryRequestDto {
  @ApiProperty({ description: '카테고리 이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '카테고리 타입',
    enum: ['income', 'expense']
  })
  @IsEnum(['income', 'expense'])
  type: 'income' | 'expense';

  @ApiProperty({ description: '아이콘', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ description: '색상', required: false })
  @IsString()
  @IsOptional()
  color?: string;
}
