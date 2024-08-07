import { Injectable } from '@nestjs/common';
import { UserRepository } from '../interface/user.repository';
import { User } from '../schema/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema, Types } from 'mongoose';
import { CreateUserRequestDto } from '../dto/request/create-user.request.dto';
import { Workspace } from '../../workspace/schema/workspace.schema';

@Injectable()
export class UserRepositoryImplement implements UserRepository {
  constructor(
    @InjectModel(User.name, 'lovechedule') private user_model: Model<User>,
    @InjectModel(Workspace.name, 'lovechedule')
    private workspace_model: Model<Workspace>,
  ) {}

  insert(body: CreateUserRequestDto): Promise<User> {
    const user = new this.user_model(body);
    return user.save();
  }

  findAll(): Promise<User[]> {
    return this.user_model.find().select('-password').exec();
  }

  findByUserId(user_id: string): Promise<User> {
    return this.user_model
      .findOne({
        user_id,
      })
      .exec();
  }

  findById(_id: string): Promise<User> {
    return (
      this.user_model
        .findById({ _id: new Types.ObjectId(_id) })
        // .populate({ path: 'workspace', model: 'Workspace' })
        .populate({
          path: 'workspaces',
          model: this.workspace_model,
          match: { users: new Types.ObjectId(_id) },
          populate: {
            path: 'users',
            model: this.user_model,
          },
        })
        .select('-password')
        .exec()
    );
  }

  join(workspace_id: Types.ObjectId, user_id: Types.ObjectId): Promise<User> {
    return this.user_model.findOneAndUpdate(
      {
        _id: user_id,
      },
      {
        workspace: workspace_id,
        new: true,
      },
    );
  }
}
