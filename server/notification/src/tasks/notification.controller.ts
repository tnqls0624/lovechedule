import { Controller, Post, Get, Body } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GrpcMethod } from "@nestjs/microservices";
import { NotificationService } from "./notification.service";
@ApiTags("test")
@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @GrpcMethod("NotificationService", "SendNotification")
  sendNotificationGrpc(request: {
    fcm_token: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }): Promise<any> {
    return this.notificationService.sendNotification(request);
  }
}
