import { Expose, Transform } from 'class-transformer';

export class CreateWorkspaceResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  readonly _id: string;

  @Expose()
  readonly title: string;

  @Expose()
  readonly invite_code: string;

  @Expose()
  readonly createAt: Date;

  @Expose()
  readonly updateAt: Date;
}
