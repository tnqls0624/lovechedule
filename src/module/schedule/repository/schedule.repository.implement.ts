import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ScheduleRepository } from '../interface/schedule.repository';
import { Schedule } from '../schema/schedule.schema';
import dayjs from 'dayjs';
import { CreateScheduleRequestDto } from '../dto/request/create-schedule.request.dto';
import { User } from '../../user/schema/user.schema';

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
    day: string
  ): Promise<Schedule[]> {
    let start_date: string, end_date: string;

    if (year && month && day) {
      start_date = dayjs(`${year}-${month}-${day}`).format(
        'YYYY-MM-DD 00:00:00'
      );
      end_date = dayjs(`${year}-${month}-${day}`)
        .add(1, 'day')
        .format('YYYY-MM-DD 00:00:00');
    } else if (year && month) {
      start_date = dayjs(`${year}-${month}-01`)
        .startOf('month')
        .format('YYYY-MM-DD 00:00:00');
      end_date = dayjs(`${year}-${month}-01`)
        .endOf('month')
        .format('YYYY-MM-DD 00:00:00');
    } else if (year) {
      start_date = dayjs(`${year}-01-01`)
        .startOf('year')
        .format('YYYY-MM-DD 00:00:00');
      end_date = dayjs(`${year}-12-31`)
        .endOf('year')
        .format('YYYY-MM-DD 00:00:00');
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

  async delete(_id: string): Promise<Schedule> {
    return this.schedule_model.findByIdAndDelete({
      _id: new Types.ObjectId(_id)
    });
  }
}
