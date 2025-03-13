import { Module, Provider } from '@nestjs/common';
import { ScheduleController } from './controller/schedule.controller';
import { ScheduleService } from './service/schedule.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Schedule, ScheduleSchema } from './schema/schedule.schema';
import { ScheduleRepositoryImplement } from './repository/schedule.repository.implement';
import { User, UserSchema } from '../user/schema/user.schema';
import {
  Workspace,
  WorkspaceSchema
} from '../workspace/schema/workspace.schema';
import { CacheModule as CacheStoreModule } from '../../lib/cache.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { FCMService } from './service/fcm.service';
import { AnniversaryNotificationService } from './service/anniversary-notification.service';

const infrastructure: Provider[] = [
  {
    provide: 'SCHEDULE_REPOSITORY',
    useClass: ScheduleRepositoryImplement
  }
];

const services = [ScheduleService, FCMService, AnniversaryNotificationService];

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
    WorkspaceModule,
    CacheStoreModule
  ],
  controllers: [...controller],
  providers: [...services, ...infrastructure]
})
export class ScheduleModule {}
