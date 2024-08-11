import { Expose } from 'class-transformer';

export class AnniversaryResponseDto {
  @Expose()
  readonly title: string;

  @Expose()
  readonly description: string;

  @Expose()
  readonly date: string;
}
