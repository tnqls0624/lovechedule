import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { UpdateInfoRequestDto } from '../dto/request/update-Info.request.dto';
import { JwtAuthGuard } from '../guard';
import { UserDto } from '../dto/user.dto';
import { User } from '../../../common/decorator/user.decorator';
import { LoginResponseDto } from '../dto/response/login.response.dto';
import { Serialize } from '../../../interceptor/serialize.interceptor';
import { ResponseDto } from '../../../common/dto/response.dto';
import { LoginRequestDto } from 'src/module/user/dto/request/login.request.dto';
import { RegisterRequestDto } from '../dto/request/register.request.dto';
import { RegisterResponseDto } from '../dto/response/register.response.dto';

@ApiTags('AUTH')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: 'Login' })
  @Serialize(LoginResponseDto)
  @Post('/login')
  async login(@Body() loginRequestDto: LoginRequestDto) {
    return this.authService.login(loginRequestDto);
  }

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: 'Register' })
  @Serialize(RegisterResponseDto)
  @Post('/register')
  async register(@Body() registerRequestDto: RegisterRequestDto) {
    return this.authService.register(registerRequestDto);
  }

  // @ApiOkResponse({
  //   type: ResponseDto,
  //   description: '성공',
  // })
  // @ApiOperation({ summary: 'Github login callback' })
  // @Get('/github/callback')
  // async githubCallback(@Query('code') code: string) {
  //   return this.authService.githubCallback(code);
  // }

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: 'My Info Update' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put('/info')
  async updateInfo(@User() user: UserDto, @Body() body: UpdateInfoRequestDto) {
    return this.authService.updateInfo(user, body);
  }

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: 'Find My Info' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(UserDto)
  @Get('/info')
  findMe(@User() user: UserDto) {
    return user;
  }
}
