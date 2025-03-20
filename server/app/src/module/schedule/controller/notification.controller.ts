import { Controller, Post, Body, Logger } from '@nestjs/common';
import { NotificationService } from '../service/notification.service';

@Controller('api/notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);
  
  constructor(private readonly notificationService: NotificationService) {}

  @Post('/anniversaries')
  async getAnniversaryNotifications(@Body() body: { today: string; tomorrow: string }) {
    this.logger.log(`기념일 알림 요청: ${JSON.stringify(body)}`);
    return this.notificationService.getAnniversaryNotifications(body);
  }

  @Post('/schedules')
  async getScheduleNotifications(@Body() body: { today: string }) {
    this.logger.log(`일정 알림 요청: ${JSON.stringify(body)}`);
    return this.notificationService.getScheduleNotifications(body);
  }

  @Post('/manual-check')
  async manualCheckSchedules() {
    this.logger.log('수동 알림 확인 요청');
    return this.notificationService.manualCheckSchedules();
  }
} 