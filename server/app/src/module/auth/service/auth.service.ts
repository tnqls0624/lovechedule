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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  private readonly generateInviteCode = customAlphabet(this.alphabet, 6);

  constructor(
    @Inject('AUTH_REPOSITORY') private readonly authRepository: AuthRepository,
    @Inject('USER_REPOSITORY') private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
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
          social_data = {
            login_type: LoginType.EMAIL,
            email: body.email,
            name: body.name,
            birthday: body.birthday,
            invite_code
          };
          break;
        }
      }
      let user = await this.userRepository.findByEmail(social_data.email);

      if (!user) {
        user = await this.authRepository.insert(social_data);
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
