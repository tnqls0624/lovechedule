import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule } from '../schema/schedule.schema';
import { User } from '../../user/schema/user.schema';
import { Workspace } from '../../workspace/schema/workspace.schema';
import { FCMService } from './fcm.service';
import dayjs from 'dayjs';

@Injectable()
export class AnniversaryNotificationService {
  private readonly logger = new Logger(AnniversaryNotificationService.name);

  constructor(
    @InjectModel(Schedule.name, 'lovechedule')
    private scheduleModel: Model<Schedule>,
    @InjectModel(User.name, 'lovechedule')
    private userModel: Model<User>,
    @InjectModel(Workspace.name, 'lovechedule')
    private workspaceModel: Model<Workspace>,
    private readonly fcmService: FCMService
  ) {}

  // 매일 오전 9시에 실행 (한국 시간)
  @Cron(CronExpression.EVERY_DAY_AT_9AM, {
    timeZone: 'Asia/Seoul'
  })
  async checkAnniversaries() {
    try {
      this.logger.log('기념일 알림 확인 작업 시작...');

      // 오늘 날짜 (YYYY-MM-DD 형식)
      const today = dayjs().format('YYYY-MM-DD');
      const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

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

        const isToday = anniversary.start_date.includes(today);
        const notificationTitle = isToday
          ? '오늘은 기념일입니다!'
          : '내일은 기념일입니다!';

        // 워크스페이스의 모든 사용자에게 알림 전송
        for (const user of workspace.users) {
          // 사용자의 알림 설정 확인
          if (user.fcm_token && user.push_enabled && user.anniversary_alarm) {
            await this.fcmService.sendPushNotification(
              user.fcm_token,
              notificationTitle,
              `${anniversary.title}`,
              {
                scheduleId: anniversary._id.toString(),
                type: 'ANNIVERSARY_REMINDER',
                isToday: isToday
              }
            );
            this.logger.log(
              `기념일 알림 전송 완료: ${user.name}님에게 "${anniversary.title}" 알림`
            );
          }
        }
      }

      this.logger.log('기념일 알림 확인 작업 완료');
    } catch (error) {
      this.logger.error('기념일 알림 확인 중 오류 발생:', error);
    }
  }

  // 테스트용 메서드 (수동으로 알림 확인 실행)
  async manualCheckAnniversaries() {
    await this.checkAnniversaries();
    return {
      success: true,
      message: '기념일 알림 확인 작업이 수동으로 실행되었습니다.'
    };
  }
}
