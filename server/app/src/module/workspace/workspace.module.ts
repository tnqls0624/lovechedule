import { forwardRef, Module, Provider } from '@nestjs/common';
import { WorkspaceController } from './controller/workspace.controller';
import { WorkspaceService } from './service/workspace.service';
import { WorkspaceRepositoryImplement } from './repository/workspace.repository.implement';
import { MongooseModule } from '@nestjs/mongoose';
import { Workspace, WorkspaceSchema } from './schema/workspace.schema';
import { UserModule } from '../user/user.module';
import { User, UserSchema } from '../user/schema/user.schema';
import { ScheduleModule } from '../schedule/schedule.module';

const infrastructure: Provider[] = [
  {
    provide: 'WORKSPACE_REPOSITORY',
    useClass: WorkspaceRepositoryImplement
  }
];

const services = [WorkspaceService];

const controller = [WorkspaceController];

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Workspace.name, schema: WorkspaceSchema },
        { name: User.name, schema: UserSchema }
      ],
      'lovechedule'
    ),
    forwardRef(() => UserModule),
    forwardRef(() => ScheduleModule)
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
  exports: [...services, ...infrastructure]
})
export class WorkspaceModule {}
