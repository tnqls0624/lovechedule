import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule } from '../schema/schedule.schema';
import { User } from '../../user/schema/user.schema';
import { Workspace } from '../../workspace/schema/workspace.schema';
import { FCMService } from './fcm.service';
import dayjs from 'dayjs';
import Redlock from 'redlock';
import Redis from 'ioredis';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private redlock: Redlock | null = null;
  private REDIS_HOST = process.env.REDIS_HOST;
  private REDIS_PORT = process.env.REDIS_PORT;

  constructor(
    @InjectModel(Schedule.name, 'lovechedule')
    private scheduleModel: Model<Schedule>,
    @InjectModel(User.name, 'lovechedule')
    private userModel: Model<User>,
    @InjectModel(Workspace.name, 'lovechedule')
    private workspaceModel: Model<Workspace>,
    private readonly fcmService: FCMService,
    @Inject('CACHE_MANAGER') private cacheManager: any
  ) {
    try {
      // ioredis 클라이언트 생성
      const redisClient = new Redis({
        host: this.REDIS_HOST,
        port: parseInt(this.REDIS_PORT),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      // Redis 연결 이벤트 리스너
      redisClient.on('connect', () => {
        this.logger.log('Redis 클라이언트 연결 성공');

        // Redis 연결 성공 후 Redlock 초기화
        try {
          this.redlock = new Redlock(
            // ioredis 클라이언트 사용
            [redisClient],
            {
              driftFactor: 0.01,
              retryCount: 10, // 재시도 횟수 증가
              retryDelay: 200, // 재시도 지연 시간
              retryJitter: 100,
              automaticExtensionThreshold: 500
            }
          );

          // 에러 이벤트 리스너 추가
          this.redlock.on('error', (error) => {
            this.logger.error(`Redlock error: ${error}`);
          });

          this.logger.log('Redlock 초기화 성공');
        } catch (error) {
          this.logger.error(`Redlock 초기화 중 오류 발생: ${error}`);
          this.redlock = null;
        }
      });

      // Redis 에러 이벤트 리스너
      redisClient.on('error', (err) => {
        this.logger.error(`Redis 클라이언트 에러: ${err}`);
      });
    } catch (error) {
      this.logger.error(`Redis 클라이언트 생성 중 오류 발생: ${error}`);
      this.redlock = null;
    }
  }

  // 매일 오전 6시에 실행 (한국 시간)
  @Cron('0 6 * * *', {
    timeZone: 'Asia/Seoul'
  })
  async checkSchedules() {
    // Redlock이 초기화되지 않은 경우 락 없이 실행
    if (!this.redlock) {
      this.logger.warn(
        'Redlock이 초기화되지 않았습니다. 락 없이 알림 작업을 실행합니다.'
      );
      await this.executeScheduleNotifications();
      return;
    }

    const lockKey = 'lock:schedule_notification';
    let lock;

    try {
      // 60초 동안 유효한 락 획득 시도
      lock = await this.redlock.acquire([lockKey], 60000);
      this.logger.log('일정 알림 확인 작업 시작 (락 획득 성공)...');

      await this.executeScheduleNotifications();
    } catch (error) {
      if (error.name === 'LockError') {
        this.logger.log(
          '다른 서버 인스턴스가 이미 일정 알림 작업을 실행 중입니다.'
        );
      } else {
        this.logger.error(
          `일정 알림 확인 중 오류 발생: ${error.message || error}`
        );

        // 락 획득 실패 시에도 알림은 보내도록 함
        this.logger.warn('락 획득에 실패했지만 알림 작업을 계속 진행합니다.');
        await this.executeScheduleNotifications();
      }
    } finally {
      // 락 해제
      if (lock) {
        try {
          await lock.release();
          this.logger.log('일정 알림 락 해제 완료');
        } catch (error) {
          this.logger.error(`락 해제 중 오류 발생: ${error.message || error}`);
        }
      }
    }
  }

  // 알림 실행 로직을 별도 메서드로 분리
  private async executeScheduleNotifications() {
    try {
      // 오늘 날짜 (YYYY-MM-DD 형식)
      const today = dayjs().format('YYYY-MM-DD');
      const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');

      // 1. 기념일 알림 처리 (오늘과 내일)
      await this.processAnniversaryNotifications(today, tomorrow);

      // 2. 일반 일정 알림 처리 (오늘만)
      await this.processRegularScheduleNotifications(today);

      this.logger.log('일정 알림 확인 작업 완료');
    } catch (error) {
      this.logger.error(`알림 처리 중 오류 발생: ${error.message || error}`);
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
    } catch (error) {
      this.logger.error(
        `기념일 알림 처리 중 오류 발생: ${error.message || error}`
      );
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
    } catch (error) {
      this.logger.error(
        `일반 일정 알림 처리 중 오류 발생: ${error.message || error}`
      );
    }
  }

  // 테스트용 메서드 (수동으로 알림 확인 실행)
  async manualCheckSchedules() {
    await this.checkSchedules();
    return {
      success: true,
      message: '일정 알림 확인 작업이 수동으로 실행되었습니다.'
    };
  }
}
