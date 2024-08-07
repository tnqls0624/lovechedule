import { Expose, Transform, Type } from 'class-transformer';
import { User } from '../../../user/schema/user.schema';

export class WorkspaceResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  readonly _id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly invite_code: string;

  @Expose()
  @Type(() => User)
  readonly master: string;

  @Expose()
  @Type(() => User)
  readonly users: string[];

  @Expose()
  @Expose()
  readonly createAt: Date;

  @Expose()
  readonly updateAt: Date;
}
