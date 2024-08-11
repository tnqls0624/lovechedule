import { Schedule } from '../schema/schedule.schema';
import { CreateScheduleRequestDto } from '../dto/request/create-schedule.request.dto';
import { UpdateScheduleRequestDto } from '../dto/request/update-schedule.request.dto';
import { UpdateScheduleStatusRequestDto } from '../dto/request/update-schedule-status.request.dto';

export interface ScheduleRepository {
  insert(_id: string, body: CreateScheduleRequestDto): Promise<Schedule>;
  // findAll(): Promise<User[]>;
  findByWorkspaceId(
    _id: string,
    year: string,
    month: string,
    week: string,
    day: string
  ): Promise<Schedule[]>;
  update(_id: string, body: UpdateScheduleRequestDto): Promise<Schedule>;
  updateScheduleIsDone(
    _id: string,
    body: UpdateScheduleStatusRequestDto
  ): Promise<Schedule>;
  delete(_id: string): Promise<Schedule>;
  // findByUserId(user_id: string): Promise<User>;

  // join(workspace_id: Types.ObjectId, user_id: Types.ObjectId): Promise<User>;
}
