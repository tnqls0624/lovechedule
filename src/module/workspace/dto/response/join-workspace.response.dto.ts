import { Expose, Transform } from 'class-transformer';

export class JoinWorkspaceResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  readonly _id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly createAt: Date;

  @Expose()
  readonly updateAt: Date;
}
