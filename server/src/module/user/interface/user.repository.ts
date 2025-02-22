import { CreateUserRequestDto } from '../dto/request/create-user.request.dto';
import { UpdateUserNameRequestDto } from '../dto/request/update-user-name.request.dto';
import { User } from '../schema/user.schema';
import { Types } from 'mongoose';

export interface UserRepository {
  insert(body: CreateUserRequestDto): Promise<User>;
  updateUsersName(body: UpdateUserNameRequestDto[]): Promise<boolean>;
  findAll(): Promise<User[]>;
  findById(_id: Types.ObjectId): Promise<any>;
  findByInviteCode(code: string): Promise<any>;
  findByEmail(email: string): Promise<User>;
  confirmInviteCode(code:string): Promise<any>;
  join(workspace_id: Types.ObjectId, user_id: Types.ObjectId): Promise<User>;
}
