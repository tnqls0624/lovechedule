import { Injectable, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { TasksService } from "./tasks.service";

interface NotificationRequest {
  fcm_token: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

interface NotificationResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly tasksService: TasksService) {}

  private readonly logger = new Logger(NotificationService.name);

  @GrpcMethod("notification.NotificationService", "SendNotification")
  async sendNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse> {
    try {
      // FCM 토큰 유효성 검사
      if (!request.fcm_token || request.fcm_token.trim() === "") {
        throw new Error("유효하지 않은 FCM 토큰입니다.");
      }

      await this.tasksService.sendPushNotification(
        request.fcm_token,
        request.title,
        request.body,
        request.data
      );

      return {
        success: true,
        message: "알림이 성공적으로 전송되었습니다.",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`알림 전송 실패: ${error.message || error}`);

      return {
        success: false,
        message: `알림 전송 실패: ${error.message || "알 수 없는 오류"}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // @GrpcMethod("notification.NotificationService", "TestNotification")
  // async testNotification(
  //   request: TestNotificationRequest
  // ): Promise<NotificationResponse> {
  //   this.logger.log(`gRPC 테스트 알림 요청 수신: ${JSON.stringify(request)}`);

  //   try {
  //     await this.tasksService.sendTestNotification(request.fcm_token);

  //     return {
  //       success: true,
  //       message: "테스트 알림이 성공적으로 전송되었습니다.",
  //       timestamp: new Date().toISOString(),
  //     };
  //   } catch (error) {
  //     this.logger.error(`테스트 알림 전송 실패: ${error.message || error}`);

  //     return {
  //       success: false,
  //       message: `테스트 알림 전송 실패: ${error.message || "알 수 없는 오류"}`,
  //       timestamp: new Date().toISOString(),
  //     };
  //   }
  // }
}
