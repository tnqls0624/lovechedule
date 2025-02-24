import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CountType, ScheduleRepository } from '../interface/schedule.repository';
import { Schedule } from '../schema/schedule.schema';
import dayjs from 'dayjs';
import { CreateScheduleRequestDto } from '../dto/request/create-schedule.request.dto';
import { User } from '../../user/schema/user.schema';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { UpdateScheduleRequestDto } from '../dto/request/update-schedule.request.dto';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul');

@Injectable()
export class ScheduleRepositoryImplement implements ScheduleRepository {
  constructor(
    @InjectModel(Schedule.name, 'lovechedule')
    private schedule_model: Model<Schedule>,
    @InjectModel(User.name, 'lovechedule')
    private user_model: Model<User>
    // @InjectModel(Workspace.name, 'lovechedule')
    // private workspace_model: Model<Workspace>,
  ) {}

  async findByWorkspaceId(
    _id: Types.ObjectId,
    year: string,
    month: string
  ): Promise<Schedule[]> {
    let start_date: string, end_date: string;

    if (year && month) {
      start_date = dayjs(`${year}-${month}-01`)
        .tz()
        .startOf('month')
        .format('YYYY-MM-DD 00:00:00');
      end_date = dayjs(`${year}-${month}-01`)
        .tz()
        .endOf('month')
        .format('YYYY-MM-DD 23:59:59');
    } else if (year) {
      start_date = dayjs(`${year}-01-01`)
        .tz()
        .startOf('year')
        .format('YYYY-MM-DD 00:00:00');
      end_date = dayjs(`${year}-12-31`)
        .tz()
        .endOf('year')
        .format('YYYY-MM-DD 23:59:59');
    }

    // 1. 일반 일정 및 반복 일정 가져오기
    const schedules = await this.schedule_model
      .find({
        workspace: _id,
        $or: [
          {
            start_date: { $gte: start_date, $lt: end_date }
          }, // 일반 일정
          {
            repeat_type: 'monthly'
          }, // 매월 반복 일정
          {
            repeat_type: 'yearly'
          } // 매년 반복 일정
        ]
      })
      .populate({
        path: 'participants',
        model: this.user_model,
      })
      .exec();

    const updatedSchedules = schedules.map((schedule) => {
      const originalStartDate = dayjs(schedule.start_date);
      const originalEndDate = dayjs(schedule.end_date);

      // 매월 반복 일정 처리 (현재 월로 날짜 변경)
      if (schedule.repeat_type === 'monthly') {
        return {
          ...schedule.toObject(),
          start_date: dayjs(`${year}-${month}-${originalStartDate.date()}`)
            .tz()
            .format('YYYY-MM-DD HH:mm:ss'),
          end_date: dayjs(`${year}-${month}-${originalEndDate.date()}`)
            .tz()
            .format('YYYY-MM-DD HH:mm:ss'),
        };
      }

      // 매년 반복 일정 처리 (현재 연도로 날짜 변경)
      if (schedule.repeat_type === 'yearly') {
        return {
          ...schedule.toObject(),
          start_date: dayjs(`${year}-${originalStartDate.month() + 1}-${originalStartDate.date()}`)
            .tz()
            .format('YYYY-MM-DD HH:mm:ss'),
          end_date: dayjs(`${year}-${originalEndDate.month() + 1}-${originalEndDate.date()}`)
            .tz()
            .format('YYYY-MM-DD HH:mm:ss'),
        };
      }

      // 일반 일정은 그대로 반환
      return schedule.toObject();
    });

    return updatedSchedules;
  }

  async findById(_id: Types.ObjectId): Promise<Schedule> {
    return this.schedule_model.findById({ _id });
  }

  async count(workspace_id: Types.ObjectId, master_id: Types.ObjectId, guest_id: Types.ObjectId, countType: CountType): Promise<number> {
    let query: any = {
      workspace: workspace_id,
    };

    switch (countType) {
      case CountType.MASTER: {
        query.participants = { $eq: [master_id] };
        break;
      }
      case CountType.GUEST: {
        query.participants = { $eq: [guest_id] };
        break;
      }
      case CountType.TOGETHER: {
        query.participants = { $eq: [master_id, guest_id] };
        break;
      }
      case CountType.ANNIVERSARY: {
        query.is_anniversary = true;
        query.participants = { $eq: [master_id, guest_id] };
      }
    }
    return this.schedule_model.countDocuments(query).exec();
  }


  async insert(_id: Types.ObjectId, body: CreateScheduleRequestDto): Promise<Schedule> {
    const { participants } = body;
    const object_ids = participants.map((user) => new Types.ObjectId(user));

    const schedule = new this.schedule_model({
      title: body.title,
      memo: body.memo,
      start_date: body.start_date,
      end_date: body.end_date,
      // alram: body.alarm,
      participants: object_ids,
      workspace: _id,
      is_anniversary: body.is_anniversary
    });

    return schedule.save();
  }

  async update(_id: Types.ObjectId, body: UpdateScheduleRequestDto): Promise<Schedule> {
    return this.schedule_model
      .findByIdAndUpdate({ _id }, body, { new: true })
      .exec();
  }

  async delete(_id: Types.ObjectId): Promise<Schedule> {
    return this.schedule_model.findByIdAndDelete({_id});
  }
}
