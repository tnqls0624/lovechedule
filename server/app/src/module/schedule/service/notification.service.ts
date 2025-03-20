import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule } from '../schema/schedule.schema';
import { User } from '../../user/schema/user.schema';
import { Workspace } from '../../workspace/schema/workspace.schema';
import { FCMService } from './fcm.service';
import dayjs from 'dayjs';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Schedule.name, 'lovechedule')
    private scheduleModel: Model<Schedule>,
    @InjectModel(User.name, 'lovechedule')
    private userModel: Model<User>,
    @InjectModel(Workspace.name, 'lovechedule')
    private workspaceModel: Model<Workspace>,
    private readonly fcmService: FCMService,
    @Inject('CACHE_MANAGER') private cacheManager: any
  ) {}

  // notification 서버에서 호출될 API - 기념일 알림
  async getAnniversaryNotifications(body: { today: string, tomorrow: string }) {
    const { today, tomorrow } = body;
    
    try {
      // 기념일 알림 처리
      const anniversaries = await this.processAnniversaryNotifications(today, tomorrow);
      return { success: true, data: anniversaries };
    } catch (error) {
      this.logger.error(`기념일 알림 처리 중 오류 발생: ${error.message || error}`);
      return { success: false, error: error.message };
    }
  }

  // notification 서버에서 호출될 API - 일반 일정 알림
  async getScheduleNotifications(body: { today: string }) {
    const { today } = body;
    
    try {
      // 일반 일정 알림 처리
      const schedules = await this.processRegularScheduleNotifications(today);
      return { success: true, data: schedules };
    } catch (error) {
      this.logger.error(`일반 일정 알림 처리 중 오류 발생: ${error.message || error}`);
      return { success: false, error: error.message };
    }
  }

  // 기념일 알림 처리 (오늘과 내일)
  private async processAnniversaryNotifications(
    today: string,
    tomorrow: string
  ) {
    try {
      // 오늘과 내일이 기념일인 일정 찾기
      const anniversaries = await this.scheduleModel
        .find({
          $or: [
            // 오늘이 기념일인 경우
            {
              is_anniversary: true,
              start_date: { $regex: today }
            },
            // 내일이 기념일인 경우
            {
              is_anniversary: true,
              start_date: { $regex: tomorrow }
            },
            // 매년 반복되는 기념일 (월-일만 비교)
            {
              is_anniversary: true,
              repeat_type: 'yearly',
              start_date: {
                $regex: `-${today.substring(5)}` // MM-DD 부분만 비교
              }
            },
            // 내일이 매년 반복되는 기념일
            {
              is_anniversary: true,
              repeat_type: 'yearly',
              start_date: {
                $regex: `-${tomorrow.substring(5)}` // MM-DD 부분만 비교
              }
            }
          ]
        })
        .populate({
          path: 'workspace',
          model: this.workspaceModel,
          populate: {
            path: 'users',
            model: this.userModel
          }
        });

      this.logger.log(`${anniversaries.length}개의 기념일 알림 대상 발견`);

      // 각 기념일에 대해 알림 전송
      for (const anniversary of anniversaries) {
        const workspace = anniversary.workspace as any;
        if (!workspace || !workspace.users || workspace.users.length === 0) {
          continue;
        }

        const isToday =
          anniversary.start_date.includes(today) ||
          (anniversary.repeat_type === 'yearly' &&
            anniversary.start_date.substring(5) === today.substring(5));

        const notificationTitle = isToday
          ? '오늘은 기념일입니다!'
          : '내일은 기념일입니다!';

        // 워크스페이스의 모든 사용자에게 알림 전송
        for (const user of workspace.users) {
          // 사용자의 알림 설정 확인
          if (user.fcm_token && user.push_enabled && user.anniversary_alarm) {
            try {
              // FCM 데이터는 문자열 값만 포함해야 함
              await this.fcmService.sendPushNotification(
                user.fcm_token,
                notificationTitle,
                `${anniversary.title}`,
                {
                  scheduleId: anniversary._id.toString(),
                  type: 'ANNIVERSARY_REMINDER',
                  isToday: isToday ? 'true' : 'false' // boolean을 문자열로 변환
                }
              );
              this.logger.log(
                `기념일 알림 전송 완료: ${user.name}님에게 "${anniversary.title}" 알림`
              );
            } catch (error) {
              this.logger.error(
                `기념일 알림 전송 실패: ${error.message || error}`
              );
            }
          }
        }
      }
      
      return anniversaries;
    } catch (error) {
      this.logger.error(
        `기념일 알림 처리 중 오류 발생: ${error.message || error}`
      );
      throw error;
    }
  }

  // 일반 일정 알림 처리 (오늘만)
  private async processRegularScheduleNotifications(today: string) {
    try {
      // 오늘 일정 찾기 (기념일 제외)
      const schedules = await this.scheduleModel
        .find({
          is_anniversary: false,
          $or: [
            // 오늘 일반 일정
            {
              start_date: { $regex: today }
            },
            // 매월 반복 일정 (일만 비교)
            {
              repeat_type: 'monthly',
              start_date: { $regex: `-${today.substring(8)}` } // DD 부분만 비교
            }
          ]
        })
        .populate({
          path: 'workspace',
          model: this.workspaceModel,
          populate: {
            path: 'users',
            model: this.userModel
          }
        });

      this.logger.log(`${schedules.length}개의 일반 일정 알림 대상 발견`);

      // 각 일정에 대해 알림 전송
      for (const schedule of schedules) {
        const workspace = schedule.workspace as any;
        if (!workspace || !workspace.users || workspace.users.length === 0) {
          continue;
        }

        const notificationTitle = '오늘 일정이 있습니다!';
        const startTime = dayjs(schedule.start_date).format('HH:mm');
        const notificationBody = `${schedule.title} (${startTime})`;

        // 워크스페이스의 모든 사용자에게 알림 전송
        for (const user of workspace.users) {
          // 사용자의 알림 설정 확인
          if (user.fcm_token && user.push_enabled && user.schedule_alarm) {
            try {
              // FCM 데이터는 문자열 값만 포함해야 함
              await this.fcmService.sendPushNotification(
                user.fcm_token,
                notificationTitle,
                notificationBody,
                {
                  scheduleId: schedule._id.toString(),
                  type: 'SCHEDULE_REMINDER',
                  isToday: 'true' // boolean을 문자열로 변환
                }
              );
              this.logger.log(
                `일정 알림 전송 완료: ${user.name}님에게 "${schedule.title}" 알림`
              );
            } catch (error) {
              this.logger.error(
                `일정 알림 전송 실패: ${error.message || error}`
              );
            }
          }
        }
      }
      
      return schedules;
    } catch (error) {
      this.logger.error(
        `일반 일정 알림 처리 중 오류 발생: ${error.message || error}`
      );
      throw error;
    }
  }

  // 테스트용 메서드 (수동으로 알림 확인 실행)
  async manualCheckSchedules() {
    const today = dayjs().format('YYYY-MM-DD');
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
    
    // 1. 기념일 알림 처리 (오늘과 내일)
    await this.processAnniversaryNotifications(today, tomorrow);
    
    // 2. 일반 일정 알림 처리 (오늘만)
    await this.processRegularScheduleNotifications(today);
    
    return {
      success: true,
      message: '일정 알림 확인 작업이 수동으로 실행되었습니다.'
    };
  }
}
