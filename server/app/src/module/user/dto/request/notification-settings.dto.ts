import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class NotificationSettingsDto {
  @ApiProperty({
    example: true,
    description: '푸시 알림 전체 활성화 여부'
  })
  @IsBoolean()
  @IsOptional()
  push_enabled?: boolean;

  @ApiProperty({
    example: true,
    description: '일정 알림 활성화 여부'
  })
  @IsBoolean()
  @IsOptional()
  schedule_alarm?: boolean;

  @ApiProperty({
    example: true,
    description: '기념일 알림 활성화 여부'
  })
  @IsBoolean()
  @IsOptional()
  anniversary_alarm?: boolean;

  //   @ApiProperty({
  //     example: true,
  //     description: '메시지 알림 활성화 여부'
  //   })
  //   @IsBoolean()
  //   @IsOptional()
  //   message_alarm?: boolean;
}
