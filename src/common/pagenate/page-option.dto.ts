import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PageOptionsDto {
  @ApiProperty({ minimum: 1, default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page: number;

  @ApiProperty({ minimum: 1, maximum: 10000, default: 15, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  readonly limit: number;

  // @ApiPropertyOptional({
  //   type: "number | string",
  //   required: false,
  // })
  // @IsOptional()
  // readonly cursor?: number | string;
}
