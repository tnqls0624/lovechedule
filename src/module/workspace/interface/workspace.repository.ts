import { CreateWorkspaceRequestDto } from '../dto/request/create-workspace.request.dto';
import { Workspace } from '../schema/workspace.schema';
import { UserDto } from '../../auth/dto/user.dto';
import { JoinWorkspaceRequestDto } from '../dto/request/join-workspace.request.dto';
import { CreateTagRequestDto } from '../dto/request/create-tag.request.dto';

export interface WorkspaceRepository {
  create(
    user: UserDto,
    invite_code: string,
    body: CreateWorkspaceRequestDto,
  ): Promise<Workspace>;
  join(user: UserDto, body: JoinWorkspaceRequestDto): Promise<Workspace>;
  findOneById(id: string): Promise<Workspace>;
  createTag(_id: string, body: CreateTagRequestDto): Promise<Workspace>;

  // update(_id: string, body: UpdateInfoRequestDto): Promise<User>;
  //   delete(entity: UserEntity): Promise<boolean>;
}
