import { ApiProperty } from '@nestjs/swagger';
import { MaxLength } from 'class-validator';

export class UpdateUserNameRequestDto {
  @ApiProperty({
    example: 'john',
    description: '유저 이름'
  })
  @MaxLength(20)
  readonly name: string;

  @ApiProperty({
    example: 'dsadsadsadsadsa',
    description: '아이디'
  })
  readonly _id: string;
}
