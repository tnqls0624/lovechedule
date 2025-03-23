import { Controller, Post, Get, Body } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TasksService } from "./tasks.service";
import { TestNotificationDto } from "./dto/test-notification.dto";

interface SendNotificationDto {
  fcm_token: string;
  title: string;
  body: string;
  data: Record<string, string>;
}

@ApiTags("알림")
@Controller("/")
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @ApiOperation({
    summary: "일정 알림 체크 수동 트리거",
    description: "일정 알림 체크가 트리거되었습니다.",
  })
  @Post("check")
  async manualCheckSchedules() {
    const result = await this.tasksService.handleDailyScheduleCheck();
    return {
      success: true,
      message: "일정 알림 체크가 트리거되었습니다.",
      result,
    };
  }

  @ApiOperation({
    summary: "테스트 알림 전송",
    description: "테스트 알림을 전송합니다.",
  })
  @ApiResponse({
    status: 200,
    description: "테스트 알림이 성공적으로 전송되었습니다.",
  })
  @Post("test")
  async sendTestNotification(@Body() body: TestNotificationDto) {
    if (!body.fcmToken) {
      return { success: false, message: "FCM 토큰이 필요합니다." };
    }

    await this.tasksService.sendTestNotification(body.fcmToken);
    return { success: true, message: "테스트 알림이 전송되었습니다." };
  }

  @ApiOperation({
    summary: "알림 전송",
    description: "FCM을 통해 알림을 전송합니다. (HTTP 폴백용)",
  })
  @ApiResponse({
    status: 200,
    description: "알림이 성공적으로 전송되었습니다.",
  })
  @Post("send")
  async sendNotification(@Body() notificationDto: SendNotificationDto) {
    const { fcm_token, title, body, data } = notificationDto;
    await this.tasksService.sendPushNotification(fcm_token, title, body, data);
    return {
      success: true,
      message: "알림이 성공적으로 전송되었습니다.",
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: "서버 상태 확인" })
  @ApiResponse({ status: 200, description: "서버가 정상 작동 중입니다." })
  @Get("health")
  async checkHealth() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "notification-server",
    };
  }
}
