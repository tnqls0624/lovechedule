import { Expose, Transform, Type } from 'class-transformer';
import { LoginType } from '../../../common/type/user';
import { Workspace } from '../../workspace/schema/workspace.schema';

export class UserDto {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
  readonly _id: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly birthday: string;

  @Expose()
  readonly gender: string;

  @Expose()
  readonly invite_code: string;

  @Expose()
  readonly fcm_token: string;

  @Expose()
  readonly push_enabled: boolean;

  @Expose()
  readonly schedule_alarm: boolean;

  @Expose()
  readonly anniversary_alarm: boolean;

  // @Expose()
  // readonly message_alarm: boolean;

  @Expose()
  readonly thumbnail_image: string;

  @Expose()
  readonly login_type: LoginType;

  @Expose()
  @Type(() => Workspace)
  readonly workspaces: Workspace;
}
