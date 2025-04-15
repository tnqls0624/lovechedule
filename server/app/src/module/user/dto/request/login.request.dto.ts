import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { LoginType } from 'src/common/type/user';

export class LoginRequestDto {
  @ApiProperty({
    example: 'dnsajkdnfkanjklds',
    description: '액세스 토큰'
  })
  @IsString()
  readonly access_token: string;

  @ApiProperty({
    enum: LoginType,
    example: LoginType.KAKAO,
    description: '소셜 로그인 타입'
  })
  @IsString()
  readonly login_type: string;

  // email
  @ApiProperty({
    example: 'test@test.com',
    description: '이메일'
  })
  @IsString()
  @IsOptional()
  readonly email: string;

  // name
  @ApiProperty({
    example: '홍길동',
    description: '이름'
  })
  @IsString()
  @IsOptional()
  readonly name: string;

  // birthday
  @ApiProperty({
    example: '1990-01-01',
    description: '생년월일'
  })
  @IsString()
  @IsOptional()
  readonly birthday: string;
}
