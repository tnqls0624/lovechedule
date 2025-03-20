import { Expose, Transform, Type } from 'class-transformer';
import { Tag } from '../../schema/workspace.schema';
import { User } from '../../../user/schema/user.schema';

export class JoinWorkspaceResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  readonly _id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly love_day: string;

  @Expose()
  readonly invite_code: string;

  @Expose()
  readonly emoji: any;

  @Expose()
  @Type(() => Tag)
  readonly tags: string[];

  @Expose()
  @Type(() => User)
  readonly master: string;

  @Expose()
  @Type(() => User)
  readonly users: string[];

  @Expose()
  readonly createAt: Date;

  @Expose()
  readonly updateAt: Date;
}
