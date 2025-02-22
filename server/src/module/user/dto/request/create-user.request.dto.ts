import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';
import { LoginType } from '../../../../common/type/user';

export class CreateUserRequestDto {
  @ApiProperty({
    example: 'dktnqls0624@naver.com',
    description: '이메일'
  })
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    example: 'john',
    description: '유저 이름'
  })
  @MaxLength(20)
  readonly name: string;

  @ApiProperty({
    example: 'M',
    description: '남자'
  })
  readonly gender: string;

  @ApiProperty({
    example: '0624',
    description: '생일'
  })
  readonly birthday: string;

  @ApiProperty({
    example: LoginType.BASIC,
    description: '로그인 타입'
  })
  @IsString()
  readonly login_type: string;
}
