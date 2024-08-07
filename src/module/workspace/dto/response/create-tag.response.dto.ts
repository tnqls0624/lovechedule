import { Expose, Transform, Type } from 'class-transformer';
import { User } from '../../../user/schema/user.schema';

export class CreateTagResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  readonly _id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly tags: object[];

  @Expose()
  readonly createAt: Date;

  @Expose()
  readonly updateAt: Date;
}
