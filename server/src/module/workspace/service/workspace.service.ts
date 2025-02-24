import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { CreateWorkspaceRequestDto } from '../dto/request/create-workspace.request.dto';
import { WorkspaceRepository } from '../interface/workspace.repository';
import { UserDto } from '../../auth/dto/user.dto';
import { Workspace } from '../schema/workspace.schema';
import { UserRepository } from '../../user/interface/user.repository';
import { Types } from 'mongoose';
import { UpdateWorkspaceRequestDto } from '../dto/request/update-workspace.request.dto';
import { UpdateUserNameRequestDto } from 'src/module/user/dto/request/update-user-name.request.dto';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);
  constructor(
    @Inject('WORKSPACE_REPOSITORY')
    private readonly workspaceRepository: WorkspaceRepository,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: UserRepository
  ) {}

  async create(user_dto: UserDto, body: CreateWorkspaceRequestDto) {
    try {
      const master_user = await this.userRepository.findByInviteCode(body.invite_code);
      if (!master_user) {
        throw new NotFoundException('초대코드를 찾을 수 없습니다');
      }

      const workspace = await this.workspaceRepository.create(
        new Types.ObjectId(String(user_dto._id)),
        master_user._id,
        body
      );

      return workspace;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async update(_id: string, body: UpdateWorkspaceRequestDto) {
    try {
      const {users, ...rest} = body;
      if(users){
        await this.userRepository.updateUsersName(body.users as UpdateUserNameRequestDto[]);
      }
      const workspace = await this.workspaceRepository.update(
        new Types.ObjectId(_id),
        rest as UpdateWorkspaceRequestDto
      );
      return workspace;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  // async createTag(_id: string, body: CreateTagRequestDto) {
  //   try {
  //     const workspace = await this.workspaceRepository.createTag(new Types.ObjectId(String(_id)), body);
  //     return workspace;
  //   } catch (e) {
  //     this.logger.error(e);
  //     throw new HttpException(e, e.status);
  //   }
  // }

  // async join(user_dto: UserDto, body: JoinWorkspaceRequestDto) {
  //   try {
  //     const workspace = await this.workspaceRepository.join(new Types.ObjectId(String(user_dto._id)), body);
  //     if (!workspace) throw new NotFoundException('no workspace');
  //
  //     await this.userRepository.join(
  //       workspace._id,
  //       new Types.ObjectId(String(user_dto._id))
  //     );
  //     return workspace;
  //   } catch (e) {
  //     this.logger.error(e);
  //     throw new HttpException(e, e.status);
  //   }
  // }

  async findOneById(_id: string): Promise<Workspace> {
    try {
      const workspace = await this.workspaceRepository.findOneById(new Types.ObjectId(String(_id)));
      if (!workspace) throw new NotFoundException('no workspace');
      return workspace;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }
}
