import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { MongooseModule } from "@nestjs/mongoose";
import {
  User,
  UserSchema,
  Schedule,
  ScheduleSchema,
  Workspace,
  WorkspaceSchema,
} from "../schemas";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature(
      [
        { name: User.name, schema: UserSchema },
        { name: Schedule.name, schema: ScheduleSchema },
        { name: Workspace.name, schema: WorkspaceSchema },
      ],
      "lovechedule"
    ),
  ],
  controllers: [TasksController, NotificationController],
  providers: [TasksService, NotificationService],
  exports: [TasksService, NotificationService],
})
export class TasksModule {}
