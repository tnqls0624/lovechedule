import { forwardRef, Module, Provider } from '@nestjs/common';
import { ScheduleController } from './controller/schedule.controller';
import { ScheduleService } from './service/schedule.service';
import { ScheduleRepositoryImplement } from './repository/schedule.repository.implement';
import { MongooseModule } from '@nestjs/mongoose';
import { Schedule, ScheduleSchema } from './schema/schedule.schema';
import { User, UserSchema } from '../user/schema/user.schema';
import {
  Workspace,
  WorkspaceSchema
} from '../workspace/schema/workspace.schema';
import { CacheModule as CacheStoreModule } from '../../lib/cache.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { WorkspaceRepositoryImplement } from '../workspace/repository/workspace.repository.implement';
import { HttpModule } from '@nestjs/axios';

const infrastructure: Provider[] = [
  {
    provide: 'SCHEDULE_REPOSITORY',
    useClass: ScheduleRepositoryImplement
  },
  {
    provide: 'WORKSPACE_REPOSITORY',
    useClass: WorkspaceRepositoryImplement
  }
];

const services = [ScheduleService];

const controller = [ScheduleController];

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Schedule.name, schema: ScheduleSchema },
        { name: User.name, schema: UserSchema },
        { name: Workspace.name, schema: WorkspaceSchema }
      ],
      'lovechedule'
    ),
    forwardRef(() => WorkspaceModule),
    CacheStoreModule,
    HttpModule
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
  exports: [...services, ...infrastructure]
})
export class ScheduleModule {}
