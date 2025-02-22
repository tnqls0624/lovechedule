import { Expose, Transform } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  readonly _id: string;

  @Expose()
  readonly email: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly type: string;

  @Expose()
  readonly login_type: string;

  @Expose()
  readonly birthday: string;

  @Expose()
  readonly invite_code: string;

  @Expose()
  readonly gender: string;
}
