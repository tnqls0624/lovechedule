import { Album } from '../schema/album.schema';
import { CreateAlbumRequestDto } from '../dto/request/create-album.request.dto';
import { UserDto } from '../../auth/dto/user.dto';

export interface AlbumRepository {
  insert(
    user: UserDto,
    _id: string,
    body: CreateAlbumRequestDto
  ): Promise<Album>;
  findAll(_id: string): Promise<Album[]>;
  delete(_id: string): Promise<Album>;
  // create(
  //   user: UserDto,
  //   invite_code: string,
  //   body: CreateWorkspaceRequestDto,
  // ): Promise<Workspace>;
  // join(user: UserDto, body: JoinWorkspaceRequestDto): Promise<Workspace>;
  // findOneById(id: string): Promise<Workspace>;
  // createTag(_id: string, body: CreateTagRequestDto): Promise<Workspace>;
  // update(_id: string, body: UpdateInfoRequestDto): Promise<User>;
  //   delete(entity: UserEntity): Promise<boolean>;
}
