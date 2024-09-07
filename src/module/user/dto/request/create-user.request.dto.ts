import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { LoginType } from '../../../../common/type/user';

export class CreateUserRequestDto {
  @ApiProperty({
    example: 'dktnqls0624',
    description: '유저 아이디'
  })
  @MaxLength(30)
  @MinLength(3)
  readonly user_id: string;

  @ApiProperty({
    example: 'john',
    description: '유저 이름'
  })
  @MaxLength(20)
  readonly name: string;

  @ApiProperty({ example: 'asdf1234!', description: '유저 비밀번호' })
  @MaxLength(20)
  @MinLength(4)
  @IsString()
  @Matches(/^[a-zA-Z\d!@#$%^&*()_+=[\]{};':"\\|,.<>/?]*$/)
  readonly password: string;

  @ApiProperty({
    example: LoginType.BASIC,
    description: '로그인 타입'
  })
  @IsString()
  readonly login_type: string;
}
