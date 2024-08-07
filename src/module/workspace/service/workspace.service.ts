import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateWorkspaceRequestDto } from '../dto/request/create-workspace.request.dto';
import { WorkspaceRepository } from '../interface/workspace.repository';
import { UserDto } from '../../auth/dto/user.dto';
import { JoinWorkspaceRequestDto } from '../dto/request/join-workspace.request.dto';
import { customAlphabet } from 'nanoid';
import { Workspace } from '../schema/workspace.schema';
import { UserRepository } from '../../user/interface/user.repository';
import { Types } from 'mongoose';
import { CreateTagRequestDto } from '../dto/request/create-tag.request.dto';

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);
  constructor(
    @Inject('WORKSPACE_REPOSITORY')
    private readonly workspaceRepository: WorkspaceRepository,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: UserRepository,
  ) {}

  generateInviteCode(): string {
    return nanoid();
  }

  async create(user_dto: UserDto, body: CreateWorkspaceRequestDto) {
    try {
      const invite_code = this.generateInviteCode();
      const workspace = await this.workspaceRepository.create(
        user_dto,
        invite_code,
        body,
      );

      await this.userRepository.join(
        new Types.ObjectId(workspace._id.toString()),
        new Types.ObjectId(user_dto._id),
      );
      return workspace;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async createTag(_id: string, body: CreateTagRequestDto) {
    try {
      const workspace = await this.workspaceRepository.createTag(_id, body);
      return workspace;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async join(user_dto: UserDto, body: JoinWorkspaceRequestDto) {
    try {
      const workspace = await this.workspaceRepository.join(user_dto, body);
      if (!workspace) throw new NotFoundException('no workspace');

      await this.userRepository.join(
        new Types.ObjectId(workspace._id.toString()),
        new Types.ObjectId(user_dto._id),
      );
      return workspace;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async findOneById(_id: string): Promise<Workspace> {
    try {
      const workspace = await this.workspaceRepository.findOneById(_id);
      if (!workspace) throw new NotFoundException('no workspace');
      return workspace;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }
}
