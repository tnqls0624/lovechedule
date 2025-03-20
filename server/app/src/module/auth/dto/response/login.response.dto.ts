import { Expose } from 'class-transformer';

export class LoginResponseDto {
  @Expose()
  readonly access_token: string;
}
