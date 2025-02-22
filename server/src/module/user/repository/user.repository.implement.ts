import { Injectable } from '@nestjs/common';
import { UserRepository } from '../interface/user.repository';
import { User } from '../schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserRequestDto } from '../dto/request/create-user.request.dto';
import { Workspace } from '../../workspace/schema/workspace.schema';
import { UpdateUserNameRequestDto } from '../dto/request/update-user-name.request.dto';

@Injectable()
export class UserRepositoryImplement implements UserRepository {
  constructor(
    @InjectModel(User.name, 'lovechedule') private user_model: Model<User>,
    @InjectModel(Workspace.name, 'lovechedule')
    private workspace_model: Model<Workspace>
  ) {}

  confirmInviteCode(code: string): Promise<any> {
    return this.user_model.findOne({
        invite_code: code
    }).exec();
  }

  insert(body: CreateUserRequestDto): Promise<User> {
    const user = new this.user_model(body);
    return user.save();
  }

  async updateUsersName(body: UpdateUserNameRequestDto[]): Promise<boolean> {
    await this.user_model.bulkWrite(
      body.map(user => ({
        updateOne: {
          filter: { _id: user._id },
          update: { name: user.name },
        },
      }))
    );
    return true
  }

  findAll(): Promise<User[]> {
    return this.user_model.find().exec();
  }

  findByEmail(email: string): Promise<User> {
    return this.user_model
      .findOne({
        email
      })
      .exec();
  }

  findById(_id: Types.ObjectId): Promise<User> {
    return (
      this.user_model
        .findById({ _id })
        // .populate({ path: 'workspace', model: 'Workspace' })
        .populate({
          path: 'workspaces',
          model: this.workspace_model,
          match: { users: _id },
          populate: {
            path: 'users',
            model: this.user_model
          }
        })
        .exec()
    );
  }

  findByInviteCode(code: string): Promise<User> {
    return (
      this.user_model
        .findOne({ invite_code: code })
        .exec()
    );
  }

  join(workspace_id: Types.ObjectId, _id: Types.ObjectId): Promise<User> {
    return this.user_model.findOneAndUpdate(
      {
        _id
      },
      {
        workspace: workspace_id,
        new: true
      }
    );
  }
}
