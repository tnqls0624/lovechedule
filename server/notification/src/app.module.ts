import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TasksModule } from "./tasks/tasks.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URL, {
      connectionName: "lovechedule",
    }),
    ScheduleModule.forRoot(),
    TasksModule,
  ],
})
export class AppModule {}
