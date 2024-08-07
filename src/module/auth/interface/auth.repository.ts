import { CreateUserRequestDto } from '../../user/dto/request/create-user.request.dto';
import { User } from '../../user/schema/user.schema';
import { UpdateInfoRequestDto } from '../dto/request/update-Info.request.dto';

export interface AuthRepository {
  insert(body: CreateUserRequestDto): Promise<User>;
  update(_id: string, body: UpdateInfoRequestDto): Promise<User>;
  //   delete(entity: UserEntity): Promise<boolean>;
  //   findOneById(id: string): Promise<Option<UserEntity>>;
}
