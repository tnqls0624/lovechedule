import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../interface/user.repository';
import { User } from '../schema/user.schema';
import { UpdateInfoRequestDto } from '../../auth/dto/request/update-Info.request.dto';
import { Types } from 'mongoose';
import { NotificationSettingsDto } from '../dto/request/notification-settings.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: UserRepository
  ) {}

  async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.findAll();
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async confirmInviteCode(code: string) {
    try {
      const user = await this.userRepository.confirmInviteCode(code);
      return user ? true : false;
    } catch (e) {
      this.logger.error(e);
    }
  }

  async updateNotificationSettings(
    userId: string,
    body: UpdateInfoRequestDto
  ): Promise<User> {
    try {
      // ObjectId 유효성 검사
      if (!Types.ObjectId.isValid(userId)) {
        throw new HttpException('Invalid user ID format', 400);
      }

      // 알림 설정 필드만 추출
      const notificationSettings: NotificationSettingsDto = {};

      if (body.push_enabled !== undefined) {
        notificationSettings.push_enabled = body.push_enabled;
      }

      if (body.schedule_alarm !== undefined) {
        notificationSettings.schedule_alarm = body.schedule_alarm;
      }

      if (body.anniversary_alarm !== undefined) {
        notificationSettings.anniversary_alarm = body.anniversary_alarm;
      }

      // if (body.message_alarm !== undefined) {
      //   notificationSettings.message_alarm = body.message_alarm;
      // }

      // 사용자 정보 업데이트
      const updatedUser = await this.userRepository.updateNotificationSettings(
        new Types.ObjectId(userId),
        notificationSettings
      );

      return updatedUser;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        e.message || 'Failed to update notification settings',
        e.status || 500
      );
    }
  }
}
