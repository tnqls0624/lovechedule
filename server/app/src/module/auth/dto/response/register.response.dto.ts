import { LoginRequestDto } from '../../../user/dto/request/login.request.dto';
import { Expose } from 'class-transformer';
import { LoginType } from '../../../../common/type/user';

export class RegisterResponseDto extends LoginRequestDto {
  @Expose()
  readonly email: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly login_type: LoginType;

  @Expose()
  readonly createdAt: Date;

  @Expose()
  readonly updatedAt: Date;
}
