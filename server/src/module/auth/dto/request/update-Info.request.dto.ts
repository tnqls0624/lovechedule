import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateInfoRequestDto {
  @ApiProperty({
    example: '수무무',
    description: '사용할 이름'
  })
  @IsString()
  @IsOptional()
  readonly name?: string;

  @ApiProperty({
    example: 'dsnajkdsad:fdsfdsfkdsbasb',
    description: 'fcm token'
  })
  @IsString()
  @IsOptional()
  readonly fcm_token?: string;

  @ApiProperty({
    example: true,
    description: '푸시 알림 전체 활성화 여부'
  })
  @IsBoolean()
  @IsOptional()
  readonly push_enabled?: boolean;

  @ApiProperty({
    example: true,
    description: '일정 알림 활성화 여부'
  })
  @IsBoolean()
  @IsOptional()
  readonly schedule_alarm?: boolean;

  @ApiProperty({
    example: true,
    description: '기념일 알림 활성화 여부'
  })
  @IsBoolean()
  @IsOptional()
  readonly anniversary_alarm?: boolean;

  // @ApiProperty({
  //   example: true,
  //   description: '메시지 알림 활성화 여부'
  // })
  // @IsBoolean()
  // @IsOptional()
  // readonly message_alarm?: boolean;
}
