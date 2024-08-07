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
  readonly login_type: LoginType;

  @Expose()
  @Type(() => Workspace)
  readonly workspaces: Workspace;
}
