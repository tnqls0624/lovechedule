import { Schedule } from '../schema/schedule.schema';
import { CreateScheduleRequestDto } from '../dto/request/create-schedule.request.dto';
import { UpdateScheduleRequestDto } from '../dto/request/update-schedule.request.dto';
import { Types } from 'mongoose';

export enum CountType {
  MASTER = 'MASTER',
  GUEST = 'GUEST',
  TOGETHER = 'TOGETHER',
  ANNIVERSARY = 'ANNIVERSARY',
}

export interface ScheduleRepository {
  insert(_id: Types.ObjectId, body: CreateScheduleRequestDto): Promise<Schedule>;
  // findAll(): Promise<User[]>;
  findByWorkspaceId(
    _id: Types.ObjectId,
    year: string,
    month: string,
    week: string,
    day: string
  ): Promise<Schedule[]>;
  findById(_id: Types.ObjectId): Promise<Schedule>;
  update(_id: Types.ObjectId, body: UpdateScheduleRequestDto): Promise<Schedule>;
  delete(_id: Types.ObjectId): Promise<Schedule>;
  count(workspace_id: Types.ObjectId, master_id: Types.ObjectId, guest_id: Types.ObjectId, type: CountType): Promise<any>;
  // findByUserId(user_id: string): Promise<User>;

  // join(workspace_id: Types.ObjectId, user_id: Types.ObjectId): Promise<User>;
}
