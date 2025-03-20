import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ConfirmInviteCodeRequestDto {
  @ApiProperty({
    example: 'SDA123',
    description: '초대코드'
  })
  @IsString()
  @MaxLength(6)
  readonly invite_code: string;
}
