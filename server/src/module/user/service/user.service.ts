import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../interface/user.repository';
import { User } from '../schema/user.schema';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: UserRepository
  ) {}

  async findAll(): Promise<User[]> {
    try {
      return await this.userRepository.findAll();
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }
  
  async confirmInviteCode(code: string){
    try {
      const user =  await this.userRepository.confirmInviteCode(code);
      return user ? true : false;
    }catch (e) {
      this.logger.error(e);
    }
  }
}
