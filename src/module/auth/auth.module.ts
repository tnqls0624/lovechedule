import { Module, Provider } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthRepositoryImplement } from './repository/auth.repositoryImplement';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schema/user.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { PasswordModule } from '../../lib/password.module';
import { UserModule } from '../user/user.module';

const infrastructure: Provider[] = [
  {
    provide: 'AUTH_REPOSITORY',
    useClass: AuthRepositoryImplement,
  },
];

const services = [AuthService, JwtStrategy, JwtService];

const controller = [AuthController];

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<any> => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET') as string,
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
          ) as string,
        },
      }),
    }),
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    PasswordModule,
    MongooseModule.forFeature(
      [{ name: User.name, schema: UserSchema }],
      'lovechedule',
    ),
    UserModule,
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
})
export class AuthModule {}
