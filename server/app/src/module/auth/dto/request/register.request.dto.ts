import { MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoginRequestDto } from '../../../user/dto/request/login.request.dto';

export class RegisterRequestDto extends LoginRequestDto {
  @ApiProperty({
    example: '이수빈',
    description: '이름'
  })
  @MaxLength(10)
  @MinLength(1)
  readonly name: string;
}
