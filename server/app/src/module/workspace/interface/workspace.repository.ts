import { CreateWorkspaceRequestDto } from '../dto/request/create-workspace.request.dto';
import { Workspace } from '../schema/workspace.schema';
import { Types } from 'mongoose';
import { UpdateWorkspaceRequestDto } from '../dto/request/update-workspace.request.dto';

export interface WorkspaceRepository {
  create(
    user_id: Types.ObjectId,
    master_user_id: Types.ObjectId,
    body: CreateWorkspaceRequestDto
  ): Promise<Workspace>;
  update(
    _id: Types.ObjectId,
    body: UpdateWorkspaceRequestDto
  ): Promise<Workspace>;
  findOneById(
    id: Types.ObjectId,
    options?: { populate?: string[] }
  ): Promise<Workspace>;
  // createTag(_id: Types.ObjectId, body: CreateTagRequestDto): Promise<Workspace>;
  // findAnniversaryById(_id: Types.ObjectId): Promise<Workspace>;
  // deleteAnniversaryById(id: Types.ObjectId, title: string): Promise<Workspace>;
}
