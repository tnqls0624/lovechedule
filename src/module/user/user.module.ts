import { forwardRef, Module, Provider } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { UserRepositoryImplement } from './repository/user.repository.implement';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { WorkspaceModule } from '../workspace/workspace.module';
import {
  Workspace,
  WorkspaceSchema
} from '../workspace/schema/workspace.schema';

const infrastructure: Provider[] = [
  {
    provide: 'USER_REPOSITORY',
    useClass: UserRepositoryImplement
  }
];

const services = [UserService];

const controller = [UserController];

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Workspace.name, schema: WorkspaceSchema }
      ],
      'lovechedule'
    ),
    forwardRef(() => WorkspaceModule)
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
  exports: [...services, ...infrastructure]
})
export class UserModule {}
