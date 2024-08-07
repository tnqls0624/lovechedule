import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkspaceRepository } from '../interface/workspace.repository';
import { Workspace, WorkspaceStatus } from '../schema/workspace.schema';
import { CreateWorkspaceRequestDto } from '../dto/request/create-workspace.request.dto';
import { UserDto } from '../../auth/dto/user.dto';
import { JoinWorkspaceRequestDto } from '../dto/request/join-workspace.request.dto';
import { CreateTagRequestDto } from '../dto/request/create-tag.request.dto';

@Injectable()
export class WorkspaceRepositoryImplement implements WorkspaceRepository {
  constructor(
    @InjectModel(Workspace.name, 'lovechedule')
    private workspace_model: Model<Workspace>,
  ) {}

  create(
    user: UserDto,
    invite_code: string,
    body: CreateWorkspaceRequestDto,
  ): Promise<Workspace> {
    const workspace = new this.workspace_model({
      title: body.title,
      master: new Types.ObjectId(user._id),
      users: [new Types.ObjectId(user._id)],
      invite_code,
      status: WorkspaceStatus.PENDING,
    });
    return workspace.save();
  }

  createTag(_id: string, body: CreateTagRequestDto): Promise<Workspace> {
    return this.workspace_model
      .findByIdAndUpdate(new Types.ObjectId(_id), {
        $push: body,
      })
      .exec();
  }

  async join(user: UserDto, body: JoinWorkspaceRequestDto): Promise<Workspace> {
    const one_day_ago = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.workspace_model
      .findOneAndUpdate(
        {
          invite_code: body.invite_code,
          status: WorkspaceStatus.PENDING,
          createdAt: { $gte: one_day_ago },
          users: { $nin: [new Types.ObjectId(user._id)] }, // 유저가 포함되지 않은 경우
        },
        {
          $push: { users: new Types.ObjectId(user._id) },
          $set: { status: WorkspaceStatus.ACTIVE },
        },
        { new: true },
      )
      .exec();
  }

  findOneById(_id: string): Promise<Workspace> {
    return this.workspace_model
      .findById(_id)
      .populate({ path: 'users', model: 'User' })
      .populate({ path: 'master', model: 'User' })
      .populate({
        path: 'schedules',
        model: this.workspace_model,
        match: { workspace: new Types.ObjectId(_id) },
        // populate: {
        //   path: 'users',
        //   model: this.user_model,
        // },
      })
      .exec();
  }
}
