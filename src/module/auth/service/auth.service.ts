import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthRepository } from '../interface/auth.repository';
import * as process from 'node:process';
import { LoginType } from '../../../common/type/user';
import { LoginRequestDto } from '../../user/dto/request/login.request.dto';
import { UserRepository } from '../../user/interface/user.repository';
import {
  PASSWORD_GENERATOR,
  PasswordGenerator,
} from '../../../lib/password.module';
import { JwtService } from '@nestjs/jwt';
import { UpdateInfoRequestDto } from '../dto/request/update-Info.request.dto';
import { UserDto } from '../dto/user.dto';
import { RegisterRequestDto } from '../dto/request/register.request.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject('AUTH_REPOSITORY') private readonly authRepository: AuthRepository,
    @Inject('USER_REPOSITORY') private readonly userRepository: UserRepository,
    @Inject(PASSWORD_GENERATOR)
    private readonly passwordGenerator: PasswordGenerator,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: RegisterRequestDto) {
    try {
      const user = await this.userRepository.findByUserId(body.user_id);
      if (user) throw new BadRequestException('Already Exist User');
      const password = await this.passwordGenerator.generateHash(body.password);
      const user_data = {
        user_id: body.user_id,
        password,
        name: body.name,
        login_type: LoginType.BASIC,
      };
      return await this.authRepository.insert(user_data);
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async login(body: LoginRequestDto): Promise<any> {
    try {
      const { user_id, password } = body;

      const user = await this.userRepository.findByUserId(user_id);
      if (!user) throw new BadRequestException('Not Found User');
      const password_confirm = await this.passwordGenerator.confirmHash(
        password,
        user.password,
      );

      if (!password_confirm)
        throw new BadRequestException('Password Incorrect');
      const access_token = await this.jwtService.signAsync(
        {
          _id: user._id,
        },
        {
          secret: process.env.JWT_ACCESS_TOKEN_SECRET,
          expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
        },
      );
      return { access_token };
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async updateInfo(user: UserDto, body: UpdateInfoRequestDto) {
    await this.authRepository.update(user._id, body);
    return true;
  }

  // async githubCallback(code: string) {
  //   try {
  //     const github_token = await this.getGithubToken(code);
  //     if (!github_token) throw new BadRequestException('Oauth Login Error');
  //
  //     const user_info = await this.getUserInfoWithGithub(github_token);
  //     const user_data = {
  //       user_id: user_info.data.login,
  //       password: user_info.data.node_id,
  //       github_token,
  //       name: user_info.data.name || 'undefined',
  //       type: UserType.ADMIN,
  //       login_type: LoginType.GITHUB,
  //     };
  //     let user = await this.userRepository.findByUserId(user_info.data.login);
  //     if (!user) user = await this.authRepository.insert(user_data);
  //
  //     const access_token = await this.jwtService.signAsync(
  //       {
  //         _id: user._id,
  //         two_factor_enabled: user.two_factor_enabled,
  //         two_factor_authenticate: false,
  //       },
  //       {
  //         secret: process.env.JWT_ACCESS_TOKEN_SECRET,
  //         expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  //       },
  //     );
  //     return {
  //       access_token,
  //       two_factor_enabled: user.two_factor_enabled,
  //     };
  //   } catch (e) {
  //     this.logger.error(e);
  //     throw new HttpException(e, e.status);
  //   }
  // }
}
