import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
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

  //   @MessagePattern('notifications')
  //   getNotifications(@Payload() data: number[], @Ctx() context: MqttContext) {
  //     console.log(`Topic: ${context.getTopic()}`);
  //   }
}
