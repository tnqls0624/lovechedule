import { Expose, Transform } from 'class-transformer';

export class CreateTagResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  readonly _id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly tags: object[];

  @Expose()
  readonly love_day: string;

  @Expose()
  readonly createAt: Date;

  @Expose()
  readonly updateAt: Date;
}
