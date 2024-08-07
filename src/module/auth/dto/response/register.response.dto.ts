import { LoginRequestDto } from 'src/module/user/dto/request/login.request.dto';
import { Expose } from 'class-transformer';
import { LoginType, UserType } from 'src/common/type/user';

export class RegisterResponseDto extends LoginRequestDto {
  @Expose()
  readonly user_id: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly type: UserType;

  @Expose()
  readonly login_type: LoginType;

  @Expose()
  readonly two_factor_enabled: string;

  @Expose()
  readonly createdAt: Date;

  @Expose()
  readonly updatedAt: Date;
}
