import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger';
import { UserService } from '../service/user.service';
import { JwtAuthGuard } from '../../auth/guard';
import { Serialize } from '../../../interceptor/serialize.interceptor';
import { UserResponseDto } from '../../auth/dto/response/user.response.dto';
import { ResponseDto } from '../../../common/dto/response.dto';

@ApiTags('USER')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Find All User List' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(UserResponseDto)
  @Get('/list')
  async findAll() {
    return this.userService.findAll();
  }

  @ApiOperation({ summary: 'Find All User List' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    type: 'string',
    name: 'code',
    required: true,
  })
  @Get('/invite/:code')
  async confirmInviteCode(@Param('code') code: string) {
    return this.userService.confirmInviteCode(code);
  }

  //   @MessagePattern('notifications')
  //   getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  //     console.log(`Topic: ${context.getTopic()}`);
  //   }
}
