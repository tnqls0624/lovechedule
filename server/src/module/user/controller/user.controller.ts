import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import { UpdateInfoRequestDto } from '../../auth/dto/request/update-Info.request.dto';

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
    required: true
  })
  @Get('/invite/:code')
  async confirmInviteCode(@Param('code') code: string) {
    return this.userService.confirmInviteCode(code);
  }

  @ApiOperation({ summary: '알림 설정 업데이트' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: UpdateInfoRequestDto,
    description: '알림 설정 정보'
  })
  @Patch('/notification-settings')
  async updateNotificationSettings(
    @Req() req: any,
    @Body() body: UpdateInfoRequestDto
  ) {
    const userId = req.user._id;
    return this.userService.updateNotificationSettings(userId, body);
  }

  //   @MessagePattern('notifications')
  //   getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  //     console.log(`Topic: ${context.getTopic()}`);
  //   }
}
