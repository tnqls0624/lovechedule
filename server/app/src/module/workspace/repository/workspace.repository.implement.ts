import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkspaceRepository } from '../interface/workspace.repository';
import { Workspace } from '../schema/workspace.schema';
import { CreateWorkspaceRequestDto } from '../dto/request/create-workspace.request.dto';
import { UpdateWorkspaceRequestDto } from '../dto/request/update-workspace.request.dto';

@Injectable()
export class WorkspaceRepositoryImplement implements WorkspaceRepository {
  constructor(
    @InjectModel(Workspace.name, 'lovechedule')
    private workspace_model: Model<Workspace>
  ) {}

  create(
    user_id: Types.ObjectId,
    master_user_id: Types.ObjectId,
    body: CreateWorkspaceRequestDto
  ): Promise<Workspace> {
    const workspace = new this.workspace_model({
      master: master_user_id,
      users: [user_id, master_user_id],
      ...body
    });
    return workspace.save();
  }

  update(
    _id: Types.ObjectId,
    body: UpdateWorkspaceRequestDto
  ): Promise<Workspace> {
    return this.workspace_model.findByIdAndUpdate(_id, { $set: body }).exec();
  }

  // createTag(_id: Types.ObjectId, body: CreateTagRequestDto): Promise<Workspace> {
  //   return this.workspace_model
  //     .findByIdAndUpdate(_id, { $push: body })
  //     .exec();
  // }
  //
  // join(_id: Types.ObjectId, body: JoinWorkspaceRequestDto): Promise<Workspace> {
  //   const one_day_ago = dayjs().subtract(1, 'day').toDate();
  //   return this.workspace_model
  //     .findOneAndUpdate(
  //       { invite_code: body.invite_code, users: { $nin: [ _id ] } },
  //       { $push: { users: _id }, $set: { status: WorkspaceStatus.ACTIVE } },
  //       { new: true })
  //     .exec();
  // }

  findOneById(
    _id: Types.ObjectId,
    options?: { populate?: string[] }
  ): Promise<Workspace> {
    let query = this.workspace_model.findById({ _id });

    // 기본적으로 항상 populate할 필드
    query = query.populate({ path: 'master', model: 'User' });

    // options.populate가 있으면 해당 필드들을 추가로 populate
    if (options?.populate) {
      if (options.populate.includes('users')) {
        query = query.populate({ path: 'users', model: 'User' });
      }
    } else {
      // 기존 동작 유지: users도 기본적으로 populate
      query = query.populate({ path: 'users', model: 'User' });
    }

    return query.exec();
  }

  // findAnniversaryById(_id: Types.ObjectId): Promise<Workspace> {
  //   return this.workspace_model
  //     .findById({ _id })
  //     .exec();
  // }
  //
  // deleteAnniversaryById(_id: Types.ObjectId, title: string): Promise<Workspace> {
  //   return this.workspace_model
  //     .findOneAndUpdate({ _id }, { $pull: { anniversary: { title } }}, { new: true })
  //     .exec();
  // }
}
