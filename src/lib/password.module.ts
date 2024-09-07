import { Module } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

export interface PasswordGenerator {
  generateHash(password: string): Promise<string>;
  confirmHash(password: string, hash: string): Promise<boolean>;
}

class PasswordGeneratorImplement implements PasswordGenerator {
  async generateHash(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  async confirmHash(password: string, hash: string): Promise<boolean> {
    const result = await bcrypt.compare(password, hash);
    return !!result;
  }
}

export const PASSWORD_GENERATOR = 'PASSWORD_GENERATOR';

@Module({
  providers: [
    {
      provide: PASSWORD_GENERATOR,
      useClass: PasswordGeneratorImplement
    }
  ],
  exports: [PASSWORD_GENERATOR]
})
export class PasswordModule {}
