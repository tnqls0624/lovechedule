import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';
import { PageMetaDto } from './page-meta.dto';

export class PageDto<T> {
  constructor(data: T[], meta: PageMetaDto) {
    this.items = data;
    this.meta = meta;
  }
  @ApiProperty({ isArray: true })
  @IsArray()
  readonly items: T[];

  @ApiProperty({ type: () => PageMetaDto })
  readonly meta: PageMetaDto;
}
