import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as admin from "firebase-admin";
import * as path from "path";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User } from "../schemas/user.schema";
import { Schedule } from "../schemas/schedule.schema";
import { Workspace } from "../schemas/workspace.schema";
import dayjs from "dayjs";

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(User.name, "lovechedule")
    private readonly userModel: Model<User>,
    @InjectModel(Schedule.name, "lovechedule")
    private readonly scheduleModel: Model<Schedule>,
    @InjectModel(Workspace.name, "lovechedule")
    private readonly workspaceModel: Model<Workspace>
  ) {
    this.initFirebase();
  }

  /**
   * Firebase Admin SDK 초기화
   */
  private async initFirebase() {
    try {
      const keyFilePath = path.join(
        process.cwd(),
        "dist/asset/lovechedule-firebase-adminsdk-fbsvc-96c78810d7.json"
      );
      this.logger.log(`Firebase 키 파일 경로: ${keyFilePath}`);

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(keyFilePath),
        });
        this.logger.log("Firebase Admin SDK가 성공적으로 초기화되었습니다.");
      }
    } catch (error) {
      this.logger.error("Firebase Admin SDK 초기화 오류:", error);
      throw error;
    }
  }

  /**
   * 매일 오전 6시에 실행되는 일정 알림 크론 작업 (한국 시간)
   */
  @Cron("0 6 * * *", {
    timeZone: "Asia/Seoul",
  })
  async handleDailyScheduleCheck() {
    this.logger.log("일정 알림 확인 작업 시작...");

    try {
      // 오늘 날짜 형식: YYYY-MM-DD
      const today = this.getTodayDate();
      const tomorrow = this.getTomorrowDate();

      // 1. 기념일 알림 처리 (오늘과 내일)
      await this.processAnniversaryNotifications(today, tomorrow);

      // 2. 일반 일정 알림 처리 (오늘만)
      await this.processRegularScheduleNotifications(today);

      this.logger.log("일정 알림 확인 작업 완료");
      return { success: true, today, tomorrow };
    } catch (error) {
      this.logger.error(`알림 처리 중 오류 발생: ${error.message || error}`);
      throw error;
    }
  }

  /**
   * 특정 사용자에게 테스트 알림 전송
   */
  async sendTestNotification(fcmToken: string) {
    try {
      this.logger.log(`테스트 알림 전송 시작: ${fcmToken}`);

      await this.sendPushNotification(
        fcmToken,
        "테스트 알림",
        "이것은 테스트 알림입니다.",
        {
          type: "test",
          timestamp: new Date().toISOString(),
        }
      );

      this.logger.log(`테스트 알림 전송 완료`);
      return true;
    } catch (error) {
      this.logger.error(
        `테스트 알림 전송 중 오류 발생: ${error.message || error}`
      );
      throw error;
    }
  }

  /**
   * 기념일 알림 처리 (오늘과 내일)
   */
  private async processAnniversaryNotifications(
    today: string,
    tomorrow: string
  ) {
    try {
      this.logger.log(`기념일 알림 처리: ${today}, ${tomorrow}`);

      // 모든 워크스페이스 조회하고 users 필드를 populate
      const workspaces = await this.workspaceModel
        .find()
        .populate({
          path: "users",
          match: {
            push_enabled: true,
            anniversary_alarm: true,
            fcm_token: { $exists: true, $ne: null },
          },
        })
        .exec();

      let totalNotifications = 0;

      for (const workspace of workspaces) {
        // populate된 users 배열에서 조건에 맞는 사용자만 필터링
        const users = workspace.users.filter((user) => {
          // User 타입으로 캐스팅하여 타입 체크 수행
          const userObj = user as any;
          return (
            userObj.push_enabled &&
            userObj.anniversary_alarm &&
            userObj.fcm_token &&
            userObj.fcm_token.trim() !== ""
          );
        });

        if (users.length === 0) continue;

        // TODO: 기념일 정보를 가져오는 로직 구현
        // 필요한 경우 추가 모델 주입받아 사용
        const anniversaries = []; // 실제 구현 시 DB에서 조회

        // 각 기념일에 대해 알림 데이터 준비
        for (const anniversary of anniversaries) {
          for (const user of users) {
            // User 타입으로 캐스팅
            const userObj = user as any;
            totalNotifications++;
            await this.sendPushNotification(
              userObj.fcm_token,
              "기념일 알림",
              `내일은 ${anniversary.title} 기념일입니다.`,
              {
                anniversaryId: anniversary._id.toString(),
                workspaceId: workspace._id.toString(),
                type: "anniversary",
              }
            );
          }
        }
      }

      this.logger.log(`${totalNotifications}개의 기념일 알림을 전송했습니다.`);
    } catch (error) {
      this.logger.error(
        `기념일 알림 처리 중 오류 발생: ${error.message || error}`
      );
    }
  }

  /**
   * 일반 일정 알림 처리 (오늘만)
   */
  private async processRegularScheduleNotifications(today: string) {
    try {
      this.logger.log(`일정 알림 처리: ${today}`);

      // 모든 워크스페이스 조회
      const workspaces = await this.workspaceModel
        .find()
        .populate({
          path: "users",
          match: {
            push_enabled: true,
            schedule_alarm: true,
            fcm_token: { $exists: true, $ne: null },
          },
        })
        .exec();

      let totalNotifications = 0;

      for (const workspace of workspaces) {
        // populate된 users 배열에서 조건에 맞는 사용자만 필터링
        const users = workspace.users.filter((user) => {
          // User 타입으로 캐스팅하여 타입 체크 수행
          const userObj = user as any;
          return (
            userObj.push_enabled && userObj.schedule_alarm && userObj.fcm_token
          );
        });

        if (users.length === 0) continue;

        // 오늘 날짜의 스케줄 조회
        const todayDate = dayjs(today).startOf("day").toDate();
        todayDate.setHours(0, 0, 0, 0);

        const tomorrowDate = dayjs(todayDate).add(1, "day").toDate();

        // workspace._id에 해당하는 일정 조회
        const schedules = await this.scheduleModel
          .find({
            workspace: workspace._id,
            $or: [
              {
                start_date: {
                  $gte: todayDate,
                  $lt: tomorrowDate,
                },
              },
              {
                end_date: {
                  $gte: todayDate,
                  $lt: tomorrowDate,
                },
              },
            ],
          })
          .exec();

        this.logger.log(`${schedules.length}개의 일정이 조회되었습니다.`);

        // 각 스케줄에 대해 알림 전송
        for (const schedule of schedules) {
          for (const user of users) {
            // User 타입으로 캐스팅
            const userObj = user as any;
            totalNotifications++;
            await this.sendPushNotification(
              userObj.fcm_token,
              "오늘의 일정 알림",
              `${schedule.title} 일정이 있습니다.`,
              {
                scheduleId: schedule._id.toString(),
                workspaceId: workspace._id.toString(),
                type: "schedule",
              }
            );
          }
        }
      }

      this.logger.log(`${totalNotifications}개의 일정 알림을 전송했습니다.`);
    } catch (error) {
      this.logger.error(
        `일반 일정 알림 처리 중 오류 발생: ${error.message || error}`
      );
    }
  }

  /**
   * 푸시 알림 전송
   */
  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    try {
      // FCM 토큰 유효성 검사
      if (!token || token.trim() === "") {
        throw new Error("유효하지 않은 FCM 토큰입니다.");
      }

      const message = {
        notification: {
          title,
          body,
        },
        data,
        token,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`알림이 성공적으로 전송되었습니다: ${response}`);
      return response;
    } catch (error) {
      this.logger.error("푸시 알림 전송 중 오류 발생:", error);
      throw error;
    }
  }

  /**
   * 매시간 테스트용 로그 출력 크론 작업
   */
  @Cron(CronExpression.EVERY_HOUR)
  handleHourlyCheck() {
    this.logger.log("매 시간 상태 확인 실행");
  }

  /**
   * 현재 날짜를 YYYY-MM-DD 형식으로 반환
   */
  private getTodayDate(): string {
    const today = dayjs().toDate();
    return this.formatDate(today);
  }

  /**
   * 내일 날짜를 YYYY-MM-DD 형식으로 반환
   */
  private getTomorrowDate(): string {
    const tomorrow = dayjs().add(1, "day").toDate();
    return this.formatDate(tomorrow);
  }

  /**
   * 날짜를 YYYY-MM-DD 형식으로 변환
   */
  private formatDate(date: Date): string {
    return dayjs(date).format("YYYY-MM-DD");
  }
}
