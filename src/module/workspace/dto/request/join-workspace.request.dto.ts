import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class JoinWorkspaceRequestDto {
  @ApiProperty({
    example: 'S43SA1',
    description: '참여 코드',
  })
  @IsString()
  readonly invite_code: string;
}
