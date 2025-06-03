import {
  BadRequestException,
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
import { ScheduleService } from '../../schedule/service/schedule.service';
import { CreateScheduleRequestDto } from '../../schedule/dto/request/create-schedule.request.dto';
import {
  CalendarType,
  RepeatType
} from '../../schedule/dto/request/create-schedule.request.dto';
import dayjs from 'dayjs';

@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);
  constructor(
    @Inject('WORKSPACE_REPOSITORY')
    private readonly workspaceRepository: WorkspaceRepository,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: UserRepository,
    private readonly scheduleService: ScheduleService
  ) {}

  private async createAnniversarySchedules(workspace: Workspace) {
    try {
      const startDate = dayjs(workspace.love_day);

      // 매년 기념일 생성
      for (let year = 0; year <= 50; year++) {
        const anniversaryDate = startDate.add(year, 'year');

        const scheduleDto: CreateScheduleRequestDto = {
          title: `${year}주년`,
          memo: `우리의 ${year}주년을 축하합니다!`,
          start_date: anniversaryDate.format('YYYY-MM-DD'),
          end_date: anniversaryDate.format('YYYY-MM-DD'),
          calendar_type: CalendarType.SOLAR,
          repeat_type: RepeatType.NONE,
          participants: [workspace.master.toString(), workspace.users[0]],
          is_anniversary: true
        };

        await this.scheduleService.insert(
          workspace.master as unknown as UserDto,
          workspace._id.toString(),
          scheduleDto
        );
      }
    } catch (error) {
      this.logger.error(`기념일 스케줄 생성 중 오류 발생: ${error.message}`);
      throw error;
    }
  }

  async create(user_dto: UserDto, body: CreateWorkspaceRequestDto) {
    try {
      const master_user = await this.userRepository.findByInviteCode(
        body.invite_code
      );
      if (!master_user) {
        throw new NotFoundException('초대코드를 찾을 수 없습니다');
      }

      if (master_user._id.equals(user_dto._id)) {
        throw new BadRequestException('자기 자신을 초대할 수 없습니다');
      }

      const workspace = await this.workspaceRepository.create(
        new Types.ObjectId(String(user_dto._id)),
        master_user._id,
        body
      );

      // 50년치 기념일 스케줄 생성
      await this.createAnniversarySchedules(workspace);

      return workspace;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async update(_id: string, body: UpdateWorkspaceRequestDto) {
    try {
      const { users, ...rest } = body;
      if (users) {
        await this.userRepository.updateUsersName(
          body.users as UpdateUserNameRequestDto[]
        );
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

  async findOneById(
    _id: string,
    options?: { populate?: string[] }
  ): Promise<Workspace> {
    try {
      const workspace = await this.workspaceRepository.findOneById(
        new Types.ObjectId(_id),
        options
      );
      if (!workspace) {
        throw new HttpException('workspace not found', 404);
      }
      return workspace;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        e.message || 'Internal server error',
        e.status || 500
      );
    }
  }
}
