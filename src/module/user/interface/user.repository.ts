import { CreateUserRequestDto } from '../dto/request/create-user.request.dto';
import { User } from '../schema/user.schema';
import { Schema, Types } from 'mongoose';

export interface UserRepository {
  insert(body: CreateUserRequestDto): Promise<User>;
  findAll(): Promise<User[]>;
  findById(_id: string): Promise<User>;
  findByUserId(user_id: string): Promise<User>;

  join(workspace_id: Types.ObjectId, user_id: Types.ObjectId): Promise<User>;
}
