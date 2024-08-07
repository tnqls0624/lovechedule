import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({
    example: 'dktnqls0624',
    description: '유저 아이디',
  })
  @MaxLength(30)
  @MinLength(3)
  readonly user_id: string;

  @ApiProperty({ example: 'asdf1234!', description: '유저 비밀번호' })
  @MaxLength(20)
  @MinLength(4)
  @IsString()
  @Matches(/^[a-zA-Z\d!@#$%^&*()_+=[\]{};':"\\|,.<>/?]*$/)
  readonly password: string;
}
