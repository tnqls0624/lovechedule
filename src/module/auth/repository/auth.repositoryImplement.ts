import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../interface/auth.repository';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../../user/schema/user.schema';
import { Model, Types } from 'mongoose';
import { CreateUserRequestDto } from '../../user/dto/request/create-user.request.dto';
import { UpdateInfoRequestDto } from '../dto/request/update-Info.request.dto';

@Injectable()
export class AuthRepositoryImplement implements AuthRepository {
  constructor(
    @InjectModel(User.name, 'lovechedule') private user_model: Model<User>,
  ) {}

  insert(body: CreateUserRequestDto): Promise<User> {
    const user = new this.user_model(body);
    return user.save();
  }

  update(_id: string, body: UpdateInfoRequestDto): Promise<User> {
    return this.user_model
      .findByIdAndUpdate(new Types.ObjectId(_id), body, { new: true })
      .exec();
  }
}
