import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class CategoryDto {
  @ApiProperty({ description: '카테고리 ID' })
  @Expose()
  @Type(() => String)
  _id: string;

  @ApiProperty({ description: '워크스페이스 ID' })
  @Expose()
  @Type(() => String)
  workspaceId: string;

  @ApiProperty({ description: '카테고리 이름' })
  @Expose()
  name: string;

  @ApiProperty({ description: '카테고리 타입' })
  @Expose()
  type: 'income' | 'expense';

  @ApiProperty({ description: '아이콘' })
  @Expose()
  icon: string;

  @ApiProperty({ description: '색상' })
  @Expose()
  color: string;

  @ApiProperty({ description: '기본 카테고리 여부' })
  @Expose()
  isDefault: boolean;
}
