import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { AuthRepository } from '../interface/auth.repository';
import { LoginType } from '../../../common/type/user';
import { LoginRequestDto } from '../../user/dto/request/login.request.dto';
import { UserRepository } from '../../user/interface/user.repository';
import { JwtService } from '@nestjs/jwt';
import { UpdateInfoRequestDto } from '../dto/request/update-Info.request.dto';
import { UserDto } from '../dto/user.dto';
import axios from 'axios';
import { customAlphabet } from 'nanoid';
import {
  PasswordGenerator,
  PASSWORD_GENERATOR
} from '../../../lib/password.module';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  private readonly generateInviteCode = customAlphabet(this.alphabet, 6);

  constructor(
    @Inject('AUTH_REPOSITORY') private readonly authRepository: AuthRepository,
    @Inject('USER_REPOSITORY') private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    @Inject(PASSWORD_GENERATOR)
    private readonly passwordGenerator: PasswordGenerator
  ) {}

  async login(body: LoginRequestDto): Promise<any> {
    try {
      let social_data: any = {};
      const invite_code = this.generateInviteCode();
      switch (body.login_type) {
        case LoginType.KAKAO: {
          const data = await axios.post(
            'https://kapi.kakao.com/v2/user/me',
            {},
            {
              headers: {
                Authorization: `Bearer ${body.access_token}`
              }
            }
          );
          social_data = {
            login_type: LoginType.KAKAO,
            email: data.data.kakao_account.email,
            name: data.data.kakao_account.name,
            gender: data.data.kakao_account.gender === 'male' ? 'M' : 'F',
            birthday: data.data.kakao_account.birthday,
            thumbnail_image:
              data.data.kakao_account.profile.thumbnail_image_url,
            invite_code
          };
          break;
        }
        case LoginType.APPLE: {
          social_data = {
            login_type: LoginType.APPLE,
            email: body.email,
            name: body.name,
            invite_code
          };
          break;
        }
        case LoginType.EMAIL: {
          // EMAIL 로그인의 경우 기존 사용자 확인 및 비밀번호 검증
          const existingUser = await this.userRepository.findByEmail(
            body.email
          );

          if (!existingUser) {
            throw new HttpException(
              '사용자를 찾을 수 없습니다. 회원가입이 필요합니다.',
              404
            );
          }

          // 비밀번호 검증
          const isPasswordValid = await this.passwordGenerator.confirmHash(
            body.password,
            existingUser.password
          );

          if (!isPasswordValid) {
            throw new HttpException('비밀번호가 일치하지 않습니다.', 401);
          }

          // EMAIL 로그인은 기존 사용자 정보 사용
          social_data = existingUser;
          break;
        }
      }

      let user;
      if (body.login_type === LoginType.EMAIL) {
        // EMAIL 로그인의 경우 이미 검증된 사용자 사용
        user = social_data;
      } else {
        // 소셜 로그인의 경우 기존 로직 유지
        user = await this.userRepository.findByEmail(social_data.email);
        if (!user) {
          user = await this.authRepository.insert(social_data);
        }
      }

      const access_token = await this.jwtService.signAsync(
        {
          _id: user._id
        },
        {
          secret: process.env.JWT_ACCESS_TOKEN_SECRET,
          expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME
        }
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
}
