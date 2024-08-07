import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../user/interface/user.repository';
import { AuthService } from './service/auth.service';
import { Workspace } from '../workspace/schema/workspace.schema';

export type Payload = {
  _id: string;
  user_id: string;
  name: string;
  login_type: string;
  workspaces: Workspace;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('USER_REPOSITORY') private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET || 'secret',
    });
  }

  async validate(payload: Payload) {
    const { _id } = payload;
    const user = await this.userRepository.findById(_id);
    if (!user) {
      return false;
    }

    const user_data: Payload = {
      _id: String(user._id),
      user_id: user.user_id,
      name: user.name,
      login_type: user.login_type,
      workspaces: user.workspaces,
    };

    return user_data;
  }
}
