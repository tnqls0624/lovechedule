import { Expose, Transform, Type } from 'class-transformer';
import { User } from '../../../user/schema/user.schema';
import { Tag } from '../../schema/workspace.schema';

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
  @Type(() => Tag)
  readonly tags: Tag[];

  @Expose()
  readonly love_day: string;

  @Expose()
  readonly emoji: any;

  @Expose()
  readonly createAt: Date;

  @Expose()
  readonly updateAt: Date;
}
