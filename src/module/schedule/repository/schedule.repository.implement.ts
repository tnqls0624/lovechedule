import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScheduleRepository } from '../interface/schedule.repository';
import { Schedule } from '../schema/schedule.schema';
import dayjs from 'dayjs';
import { CreateScheduleRequestDto } from '../dto/request/create-schedule.request.dto';
import { User } from '../../user/schema/user.schema';
import { UpdateScheduleStatusRequestDto } from '../dto/request/update-schedule-status.request.dto';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

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
    _id: string,
    year: string,
    month: string,
    week: string,
    day: string
  ): Promise<Schedule[]> {
    let start_date: string, end_date: string;

    if (year && month && day) {
      start_date = dayjs(`${year}-${month}-${day}`)
        .tz()
        .format('YYYY-MM-DD 00:00:00');
      end_date = dayjs(`${year}-${month}-${day}`)
        .tz()
        .add(1, 'day')
        .format('YYYY-MM-DD 00:00:00');
    } else if (year && month && week) {
      const start_of_week = dayjs(`${year}-${month}-01`)
        .tz()
        .add(Number(week) - 1, 'week')
        .startOf('week');
      const end_of_Week = start_of_week.tz().endOf('week');
      start_date = start_of_week.tz().format('YYYY-MM-DD 00:00:00');
      end_date = end_of_Week.tz().format('YYYY-MM-DD 23:59:59');
    } else if (year && month) {
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

    const schedules = await this.schedule_model
      .find({
        date: {
          $gte: start_date,
          $lt: end_date
        }
      })
      .populate({
        path: 'participants',
        model: this.user_model
      })
      .exec();
    return schedules;
  }

  async insert(_id: string, body: CreateScheduleRequestDto): Promise<Schedule> {
    const { participants } = body;
    const object_ids = participants.map((user) => new Types.ObjectId(user));

    const schedule = new this.schedule_model({
      title: body.title,
      description: body.description,
      date: body.date,
      participants: object_ids,
      workspace: new Types.ObjectId(_id),
      tags: body.tags
    });

    return schedule.save();
  }

  async update(_id: string, body: Schedule): Promise<Schedule> {
    return this.schedule_model
      .findByIdAndUpdate(
        {
          _id: new Types.ObjectId(_id)
        },
        body,
        {
          new: true
        }
      )
      .exec();
  }

  async updateScheduleIsDone(
    _id: string,
    body: UpdateScheduleStatusRequestDto
  ): Promise<Schedule> {
    return this.schedule_model
      .findByIdAndUpdate(
        {
          _id: new Types.ObjectId(_id)
        },
        {
          $set: body
        },
        {
          new: true
        }
      )
      .exec();
  }

  async delete(_id: string): Promise<Schedule> {
    return this.schedule_model.findByIdAndDelete({
      _id: new Types.ObjectId(_id)
    });
  }
}
