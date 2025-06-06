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
import KoreanLunarCalendar from "korean-lunar-calendar";

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

      // 2. 일반 일정 알림 처리 (오늘과 내일)
      await this.processRegularScheduleNotifications(today, tomorrow);

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
          model: "User",
          match: {
            push_enabled: true,
            anniversary_alarm: true,
            fcm_token: { $exists: true, $ne: null },
          },
          select:
            "name email push_enabled schedule_alarm anniversary_alarm fcm_token",
        })
        .exec();

      let totalNotifications = 0;
      let successCount = 0;
      let failCount = 0;

      for (const workspace of workspaces) {
        // MongoDB populate에서 이미 필터링된 사용자를 사용
        const users = workspace.users as User[];

        if (!users || users.length === 0) {
          this.logger.debug(
            `워크스페이스 ${workspace._id}에 알림 대상 사용자가 없습니다.`
          );
          continue;
        }

        this.logger.log(
          `워크스페이스 ${workspace._id}: 알림 대상 사용자 ${users.length}명`
        );

        // 날짜 형식: MM-DD로 변환 (연도 제외한 월-일 형식으로 비교)
        const todayMMDD = dayjs(today).format("MM-DD");
        const tomorrowMMDD = dayjs(tomorrow).format("MM-DD");

        this.logger.log(
          `기념일 비교 - 오늘(MM-DD): ${todayMMDD}, 내일(MM-DD): ${tomorrowMMDD}`
        );

        // 워크스페이스의 기념일 조회 (Schedule에서 is_anniversary=true인 항목)
        const anniversaries = await this.scheduleModel
          .find({
            workspace: workspace._id,
            is_anniversary: true,
          })
          .exec();

        this.logger.log(
          `워크스페이스 ${workspace._id}의 전체 기념일 수: ${anniversaries.length}개`
        );

        // 앱 메모리에서 필터링 (MongoDB 쿼리가 아닌 JavaScript로 필터링)
        const filteredAnniversaries = anniversaries.filter(
          (anniversaryDoc: any) => {
            const anniversary = anniversaryDoc.toObject();
            let effectiveDate = dayjs(anniversary.start_date); // 기본적으로 양력으로 간주
            // anniversary.calendar_type이 있고, anniversary.start_date가 유효한 경우에만 변환 시도
            if (
              anniversary.calendar_type === "lunar" &&
              anniversary.start_date
            ) {
              const solarDate = this.convertLunarToSolar(
                anniversary.start_date,
                anniversary.title,
                "시작일"
              );
              if (solarDate) {
                effectiveDate = solarDate;
              } else {
                this.logger.warn(
                  `음력 변환 실패로 기념일 '${anniversary.title}'은 원래 날짜(${anniversary.start_date}) 기준으로 처리될 수 있습니다.`
                );
              }
              console.log(solarDate);
            }

            const anniversaryMMDD = effectiveDate.format("MM-DD");
            const isMatch =
              anniversaryMMDD === todayMMDD || anniversaryMMDD === tomorrowMMDD;

            if (isMatch) {
              this.logger.debug(
                `일치하는 기념일: ${anniversary.title}, 원본날짜(${anniversary.calendar_type || "solar"}): ${dayjs(anniversary.start_date).format("YYYY-MM-DD")}, 비교대상날짜(MM-DD): ${anniversaryMMDD}`
              );
            } else {
              this.logger.debug(
                `제외된 기념일: ${anniversary.title}, 원본날짜(${anniversary.calendar_type || "solar"}): ${dayjs(anniversary.start_date).format("YYYY-MM-DD")}, 비교대상날짜(MM-DD): ${anniversaryMMDD}`
              );
            }

            return isMatch;
          }
        );

        this.logger.log(
          `워크스페이스 ${workspace._id}의 오늘/내일 기념일: ${filteredAnniversaries.length}개`
        );

        // 각 기념일에 대해 알림 데이터 준비
        for (const anniversary of filteredAnniversaries) {
          // 기념일이 오늘인지 내일인지 확인
          let effectiveDateForNotification = dayjs(anniversary.start_date);
          if (
            (anniversary as any).calendar_type === "lunar" &&
            anniversary.start_date
          ) {
            const solarDate = this.convertLunarToSolar(
              anniversary.start_date,
              anniversary.title,
              "알림용 시작일" // 컨텍스트를 위한 로그 메시지용 문자열
            );
            if (solarDate) {
              effectiveDateForNotification = solarDate;
            } else {
              // 변환 실패 시 effectiveDateForNotification은 원본 날짜를 유지합니다.
              // 이 경우, 알림은 원본 날짜 기준으로 "오늘"/"내일"이 결정될 수 있습니다.
              this.logger.warn(
                `알림 메시지용 날짜 결정 시 음력 변환 실패: '${anniversary.title}'은 원본 날짜(${anniversary.start_date}) 기준으로 처리될 수 있습니다.`
              );
            }
          }

          const anniversaryMMDDForNotification =
            effectiveDateForNotification.format("MM-DD");
          const isToday = anniversaryMMDDForNotification === todayMMDD;

          // 알림 메시지 생성
          const titlePrefix = isToday ? "오늘" : "내일";
          const notificationTitle = `${titlePrefix}의 기념일 알림`;
          let notificationBody = `${anniversary.title}`;

          // 각 사용자에게 알림 전송
          for (const user of users) {
            if (!user.fcm_token) continue; // 안전 검사

            totalNotifications++;
            try {
              await this.sendPushNotification(
                user.fcm_token,
                notificationTitle,
                notificationBody,
                {
                  scheduleId: anniversary._id.toString(),
                  workspaceId: workspace._id.toString(),
                  type: "anniversary",
                  date: isToday ? today : tomorrow,
                }
              );
              successCount++;
            } catch (error) {
              failCount++;
              this.logger.error(
                `사용자 ${user._id}에게 알림 전송 실패: ${error.message}`
              );
            }
          }
        }
      }

      this.logger.log(
        `기념일 알림 통계: 총 ${totalNotifications}개 (성공: ${successCount}, 실패: ${failCount})`
      );
    } catch (error) {
      this.logger.error(
        `기념일 알림 처리 중 오류 발생: ${error.message || error}`
      );
    }
  }

  /**
   * 일반 일정 알림 처리 (오늘과 내일)
   */
  private async processRegularScheduleNotifications(
    today: string,
    tomorrow: string
  ) {
    try {
      this.logger.log(`일정 알림 처리: ${today}, ${tomorrow}`);

      // 모든 워크스페이스 조회
      const workspaces = await this.workspaceModel
        .find()
        .populate({
          path: "users",
          model: "User",
          match: {
            push_enabled: true,
            schedule_alarm: true,
            fcm_token: { $exists: true, $ne: null },
          },
          select:
            "name email push_enabled schedule_alarm anniversary_alarm fcm_token",
        })
        .exec();

      let totalNotifications = 0;
      let successCount = 0;
      let failCount = 0;

      for (const workspace of workspaces) {
        // MongoDB populate에서 이미 필터링된 사용자를 사용
        const users = workspace.users as User[];

        if (!users || users.length === 0) {
          this.logger.debug(
            `워크스페이스 ${workspace._id}에 알림 대상 사용자가 없습니다.`
          );
          continue;
        }

        // 모든 일정 조회 (기념일 제외)
        const allSchedules = await this.scheduleModel
          .find({
            workspace: workspace._id,
            is_anniversary: false,
          })
          .exec();

        // 자바스크립트에서 날짜 필터링 (start_date나 end_date가 오늘이나 내일인 경우)
        const todayDateString = today; // YYYY-MM-DD 형식
        const tomorrowDateString = tomorrow; // YYYY-MM-DD 형식

        this.logger.log(
          `오늘 날짜: ${todayDateString}, 내일 날짜: ${tomorrowDateString}`
        );

        const schedules = allSchedules.filter((schedule: any) => {
          // ISO 형식의 날짜 문자열을 dayjs로 변환하여 YYYY-MM-DD 형식으로 비교
          let effectiveStartDate = dayjs(schedule.start_date);
          if (schedule.calendar_type === "lunar" && schedule.start_date) {
            const solarStartDate = this.convertLunarToSolar(
              schedule.start_date,
              schedule.title,
              "시작일"
            );
            if (solarStartDate) {
              effectiveStartDate = solarStartDate;
            } else {
              this.logger.warn(
                `음력 시작일 변환 실패로 일정 '${schedule.title}'은 원래 시작일(${schedule.start_date}) 기준으로 처리될 수 있습니다.`
              );
            }
          }

          let effectiveEndDate = dayjs(schedule.end_date);
          // 종료일도 음력일 경우 변환 (일반적으로 calendar_type은 일정 전체에 적용됨)
          if (schedule.calendar_type === "lunar" && schedule.end_date) {
            const solarEndDate = this.convertLunarToSolar(
              schedule.end_date,
              schedule.title,
              "종료일"
            );
            if (solarEndDate) {
              effectiveEndDate = solarEndDate;
            } else {
              this.logger.warn(
                `음력 종료일 변환 실패로 일정 '${schedule.title}'은 원래 종료일(${schedule.end_date}) 기준으로 처리될 수 있습니다.`
              );
            }
          }

          const startDate = effectiveStartDate.format("YYYY-MM-DD");
          const endDate = effectiveEndDate.format("YYYY-MM-DD");

          this.logger.debug(
            `일정 ${schedule.title}: 원본시작일(${schedule.calendar_type || "solar"})=${dayjs(schedule.start_date).format("YYYY-MM-DD")}(변환된 시작일: ${startDate}), 원본종료일(${schedule.calendar_type || "solar"})=${dayjs(schedule.end_date).format("YYYY-MM-DD")}(변환된 종료일: ${endDate})`
          );

          // 오늘이거나 내일인 일정 필터링
          const isToday =
            startDate === todayDateString || endDate === todayDateString;
          const isTomorrow =
            startDate === tomorrowDateString || endDate === tomorrowDateString;

          return isToday || isTomorrow;
        });

        this.logger.log(
          `워크스페이스 ${workspace._id}의 오늘/내일 일정: ${schedules.length}개`
        );

        for (const schedule of schedules) {
          this.logger.log(
            `필터링된 일정: ${schedule.title}, 시작일: ${schedule.start_date}, 종료일: ${schedule.end_date}`
          );
        }

        // 각 스케줄에 대해 알림 전송
        for (const schedule of schedules) {
          // 일정이 오늘인지 내일인지 확인
          const startDate = dayjs(schedule.start_date).format("YYYY-MM-DD");
          const endDate = dayjs(schedule.end_date).format("YYYY-MM-DD");

          const isToday =
            startDate === todayDateString || endDate === todayDateString;

          const titlePrefix = isToday ? "오늘" : "내일";
          for (const user of users) {
            if (!user.fcm_token) continue; // 안전 검사

            totalNotifications++;
            try {
              await this.sendPushNotification(
                user.fcm_token,
                `${titlePrefix}의 일정 알림`,
                `${schedule.title}`,
                {
                  scheduleId: schedule._id.toString(),
                  workspaceId: workspace._id.toString(),
                  type: "schedule",
                  date: isToday ? today : tomorrow,
                }
              );
              successCount++;
            } catch (error) {
              failCount++;
              this.logger.error(
                `사용자 ${user._id}에게 알림 전송 실패: ${error.message}`
              );
            }
          }
        }
      }

      this.logger.log(
        `일정 알림 통계: 총 ${totalNotifications}개 (성공: ${successCount}, 실패: ${failCount})`
      );
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

  /**
   * 오늘 알림이 있는 사용자에게 테스트 알림 전송
   */
  async sendTodayTestNotification() {
    try {
      this.logger.log("오늘 알림이 있는 사용자에게 테스트 알림 전송 시작");

      // 오늘 날짜 형식: YYYY-MM-DD
      const today = this.getTodayDate();
      const todayMMDD = dayjs(today).format("MM-DD");

      this.logger.log(
        `오늘 날짜(YYYY-MM-DD): ${today}, MM-DD 형식: ${todayMMDD}`
      );

      let totalUsers = 0;
      let successCount = 0;
      let failCount = 0;

      // 모든 워크스페이스 조회
      const workspaces = await this.workspaceModel
        .find()
        .populate({
          path: "users",
          model: "User",
          match: {
            push_enabled: true,
            fcm_token: { $exists: true, $ne: null },
          },
          select:
            "name email push_enabled schedule_alarm anniversary_alarm fcm_token",
        })
        .exec();

      this.logger.log(`조회된 워크스페이스 수: ${workspaces.length}`);

      for (const workspace of workspaces) {
        // MongoDB populate에서 이미 필터링된 사용자를 사용
        const users = workspace.users as User[];

        if (!users || users.length === 0) {
          this.logger.debug(
            `워크스페이스 ${workspace._id}에 알림 대상 사용자가 없습니다.`
          );
          continue;
        }

        // 모든 일정 조회
        const allSchedules = await this.scheduleModel
          .find({
            workspace: workspace._id,
          })
          .exec();

        this.logger.log(
          `워크스페이스 ${workspace._id}의 전체 일정 수: ${allSchedules.length}개`
        );

        const todaySchedules = allSchedules.filter((schedule: any) => {
          if (schedule.is_anniversary) {
            // 기념일은 월-일 형식으로 비교
            const scheduleMMDD = dayjs(schedule.start_date).format("MM-DD");
            const isToday = scheduleMMDD === todayMMDD;

            if (isToday) {
              this.logger.debug(
                `오늘 기념일 일정: ${schedule.title}, start_date=${schedule.start_date}, MMDD=${scheduleMMDD}`
              );
            }

            return isToday;
          } else {
            // 일반 일정은 날짜 전체로 비교
            const scheduleDate = dayjs(schedule.start_date).format(
              "YYYY-MM-DD"
            );
            const isToday = scheduleDate === today;

            if (isToday) {
              this.logger.debug(
                `오늘 일반 일정: ${schedule.title}, start_date=${schedule.start_date}, 변환=${scheduleDate}`
              );
            }

            return isToday;
          }
        });

        if (!todaySchedules || todaySchedules.length === 0) {
          this.logger.debug(
            `워크스페이스 ${workspace._id}에 오늘 일정이 없습니다.`
          );
          continue;
        }

        this.logger.log(
          `워크스페이스 ${workspace._id}: 오늘 일정 ${todaySchedules.length}개, 알림 대상 사용자 ${users.length}명`
        );

        // 일정 제목 목록 생성
        const scheduleNames = todaySchedules.map((s) => s.title).join(", ");

        // 각 사용자에게 알림 전송
        for (const user of users) {
          if (!user.fcm_token) continue; // 안전 검사

          totalUsers++;
          const notificationTitle = "오늘의 일정 테스트 알림";
          const notificationBody = `오늘의 일정: ${scheduleNames}`;

          try {
            await this.sendPushNotification(
              user.fcm_token,
              notificationTitle,
              notificationBody,
              {
                workspaceId: workspace._id.toString(),
                type: "today-test",
                date: today,
                scheduleCount: todaySchedules.length.toString(),
              }
            );
            successCount++;
          } catch (error) {
            failCount++;
            this.logger.error(
              `사용자 ${user._id}에게 테스트 알림 전송 실패: ${error.message}`
            );
          }
        }
      }

      const result = {
        today,
        totalUsers,
        success: successCount,
        fail: failCount,
      };

      this.logger.log(
        `오늘의 테스트 알림 통계: 총 ${totalUsers}명 (성공: ${successCount}, 실패: ${failCount})`
      );
      return result;
    } catch (error) {
      this.logger.error(
        `오늘의 테스트 알림 전송 중 오류 발생: ${error.message || error}`
      );
      throw error;
    }
  }

  private convertLunarToSolar(
    lunarDateString: string,
    itemTitle: string,
    dateType: string
  ): dayjs.Dayjs | null {
    if (!lunarDateString) {
      this.logger.warn(
        `일정/기념일 ${itemTitle} (${dateType})에 유효한 날짜 문자열이 없습니다.`
      );
      return null;
    }
    try {
      const calendar = new KoreanLunarCalendar();
      const lunarDate = dayjs(lunarDateString);
      // KoreanLunarCalendar expects year, month (1-12), day
      if (
        calendar.setLunarDate(
          lunarDate.year(),
          lunarDate.month() + 1,
          lunarDate.date(),
          false
        )
      ) {
        // false for not leap month by default
        const solar = calendar.getSolarCalendar();
        const solarDayjs = dayjs(
          `${solar.year}-${String(solar.month).padStart(2, "0")}-${String(solar.day).padStart(2, "0")}`
        );
        this.logger.debug(
          `일정/기념일 '${itemTitle}' (${dateType} 음력: ${lunarDate.format("YYYY-MM-DD")}) -> 양력 변환: ${solarDayjs.format("YYYY-MM-DD")}`
        );
        return solarDayjs;
      } else {
        this.logger.warn(
          `일정/기념일 '${itemTitle}' (${dateType}) 음력->양력 변환 실패: ${lunarDateString}`
        );
        return null;
      }
    } catch (error) {
      this.logger.error(
        `일정/기념일 '${itemTitle}' (${dateType}) 음력->양력 변환 중 오류 (${lunarDateString}): ${error.message}`
      );
      return null;
    }
  }
}
