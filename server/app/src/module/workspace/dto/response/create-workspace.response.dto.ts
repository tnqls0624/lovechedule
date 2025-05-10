import { Expose, Transform } from 'class-transformer';
import { Tag } from '../../schema/workspace.schema';

export class CreateWorkspaceResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  readonly _id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly invite_code: string;

  @Expose()
  readonly love_day: string;

  @Expose()
  readonly tags: Tag;

  @Expose()
  readonly createAt: Date;

  @Expose()
  readonly updateAt: Date;
}
