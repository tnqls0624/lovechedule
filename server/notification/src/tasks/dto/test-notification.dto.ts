import { ApiProperty } from "@nestjs/swagger";

export class TestNotificationDto {
  @ApiProperty({
    description: "FCM 토큰",
    example: "fMz9V67r-EiVYVHloQOL9C:APA91bHgPL3H4J45SrV2XYpH_0bvVxJ9NZRM1W...",
    required: true,
  })
  fcmToken: string;
}
