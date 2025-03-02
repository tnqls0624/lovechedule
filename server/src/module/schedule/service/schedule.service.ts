import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Schedule } from '../schema/schedule.schema';
import {
  CountType,
  ScheduleRepository
} from '../interface/schedule.repository';
import { CreateScheduleRequestDto } from '../dto/request/create-schedule.request.dto';
import { UpdateScheduleRequestDto } from '../dto/request/update-schedule.request.dto';
import { CACHE_GENERATOR } from '../../../lib/cache.module';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { WorkspaceRepository } from 'src/module/workspace/interface/workspace.repository';
import { Types } from 'mongoose';
import { FCMService } from './fcm.service';
import { UserDto } from 'src/module/auth/dto/user.dto';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul');

@Injectable()
export class ScheduleService {
  constructor(
    @Inject('SCHEDULE_REPOSITORY')
    private readonly scheduleRepository: ScheduleRepository,
    @Inject(CACHE_GENERATOR)
    private readonly cacheGenerator: CACHE_GENERATOR,
    @Inject('WORKSPACE_REPOSITORY')
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly fcmService: FCMService
  ) {}

  private readonly logger = new Logger(ScheduleService.name);

  async find(
    _id: string,
    year: string,
    month: string,
    week: string,
    day: string
  ): Promise<Schedule[]> {
    try {
      const schedules = await this.scheduleRepository.findByWorkspaceId(
        new Types.ObjectId(_id),
        year,
        month,
        week,
        day
      );
      const holiday_calendar: any = await this.cacheGenerator.getCache(
        `calendar:${year}`
      );

      let current_holiday: any;
      if (year && month && day && holiday_calendar) {
        const formatted_month = month.toString().padStart(2, '0');
        const formatted_day = day.toString().padStart(2, '0');
        const year_month_day = `${year}${formatted_month}${formatted_day}`;

        current_holiday = holiday_calendar.filter(
          (holiday: { locdate: string }) =>
            holiday.locdate.toString() === year_month_day
        );
      } else if (year && month && week && holiday_calendar) {
        const start_of_week = dayjs(`${year}-${month}-01`)
          .tz()
          .add(Number(week) - 1, 'week')
          .startOf('week');
        const end_of_week = start_of_week.tz().endOf('week');

        current_holiday = holiday_calendar.filter(
          (holiday: { locdate: string }) => {
            const holidayDate = dayjs(holiday.locdate.toString());
            return (
              holidayDate.isSameOrAfter(start_of_week) &&
              holidayDate.isSameOrBefore(end_of_week)
            );
          }
        );
      } else if (year && month && holiday_calendar) {
        const formatted_month = month.padStart(2, '0');
        const year_month = `${year}${formatted_month}`;

        current_holiday = holiday_calendar.filter(
          (holiday: { locdate: number }) =>
            holiday.locdate.toString().startsWith(year_month)
        );
      } else if (year && holiday_calendar) {
        current_holiday = holiday_calendar.filter(
          (holiday: { locdate: string }) =>
            holiday.locdate.toString().startsWith(year)
        );
      }

      const combinedCalendar = [];

      current_holiday &&
        current_holiday.forEach(
          (holiday: { locdate: number; dateName: any; isHoliday: string }) => {
            const data_str = holiday.locdate.toString();
            combinedCalendar.push({
              date: dayjs(data_str).format('YYYY-MM-DD'),
              title: holiday.dateName,
              description:
                holiday.isHoliday === 'Y' ? 'Public Holiday' : 'Workday',
              participants: [],
              tags: [],
              is_holiday: true
            });
          }
        );

      schedules.forEach((schedule) => {
        combinedCalendar.push({
          _id: schedule._id,
          start_date: dayjs(schedule.start_date).format('YYYY-MM-DD HH:mm'),
          end_date: dayjs(schedule.end_date).format('YYYY-MM-DD HH:mm'),
          title: schedule.title,
          memo: schedule.memo,
          participants: schedule.participants,
          is_holiday: false,
          is_anniversary: schedule.is_anniversary,
          repeat_type: schedule.repeat_type // ✅ 반복 유형 추가
        });
      });

      combinedCalendar.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      return combinedCalendar;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async findById(_id: string): Promise<Schedule> {
    try {
      const schedule = await this.scheduleRepository.findById(
        new Types.ObjectId(_id)
      );
      return schedule;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async count(_id: string): Promise<any> {
    try {
      const workspace: any = await this.workspaceRepository.findOneById(
        new Types.ObjectId(_id)
      );
      console.log(workspace);
      const settingResult = {
        master: {
          name: workspace.master.name,
          emoji: workspace.emoji.master,
          count: 0
        },
        guest: {
          name: '',
          emoji: workspace.emoji.guest,
          count: 0
        },
        together: {
          emoji: workspace.emoji.together,
          count: 0
        },
        anniversary: {
          emoji: workspace.emoji.anniversary,
          count: 0
        }
      };

      const master_id: string = String(workspace.master._id);
      const guest_user: any = workspace.users.find(
        (user: any) => user._id.toString() !== master_id.toString()
      );

      const master_schedule_count = await this.scheduleRepository.count(
        new Types.ObjectId(_id),
        new Types.ObjectId(master_id),
        new Types.ObjectId(guest_user._id),
        CountType.MASTER
      );
      const guest_schedule_count = await this.scheduleRepository.count(
        new Types.ObjectId(_id),
        new Types.ObjectId(master_id),
        new Types.ObjectId(guest_user._id),
        CountType.GUEST
      );
      const together_schedule_count = await this.scheduleRepository.count(
        new Types.ObjectId(_id),
        new Types.ObjectId(master_id),
        new Types.ObjectId(guest_user._id),
        CountType.TOGETHER
      );
      const anniversary_schedule_count = await this.scheduleRepository.count(
        new Types.ObjectId(_id),
        new Types.ObjectId(master_id),
        new Types.ObjectId(guest_user._id),
        CountType.ANNIVERSARY
      );

      settingResult.master.count = master_schedule_count;
      settingResult.guest.count = guest_schedule_count;
      settingResult.guest.name = workspace.users.find(
        (user: any) => user._id.toString() !== master_id.toString()
      ).name;
      settingResult.together.count = together_schedule_count;
      settingResult.anniversary.count = anniversary_schedule_count;
      return settingResult;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e.message, e.status || 500);
    }
  }

  async insert(
    user: UserDto,
    _id: string,
    body: CreateScheduleRequestDto
  ): Promise<Schedule> {
    try {
      const schedule = await this.scheduleRepository.insert(
        new Types.ObjectId(_id),
        body
      );

      // 워크스페이스에서 상대방 정보 가져오기
      const workspace = await this.workspaceRepository.findOneById(
        new Types.ObjectId(_id)
      );

      const currentUserId = user._id;

      // 상대방 찾기 (커플 중 현재 사용자가 아닌 사람)
      const partner: any = workspace.users.find(
        (user: any) => user._id.toString() !== currentUserId
      );

      if (partner && partner.fcm_token) {
        await this.fcmService.sendPushNotification(
          partner.fcm_token,
          `${user.name}님의 새로운 스케줄을 등록`,
          `${body.title}`,
          {
            scheduleId: schedule._id.toString(),
            type: 'NEW_SCHEDULE'
          }
        );
      }

      return schedule;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(
        e.message || 'Internal server error',
        e.status || 500
      );
    }
  }

  async update(_id: string, body: UpdateScheduleRequestDto): Promise<Schedule> {
    try {
      const schedule = await this.scheduleRepository.update(
        new Types.ObjectId(_id),
        body
      );
      return schedule;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async delete(_id: string): Promise<Schedule> {
    try {
      const schedule = await this.scheduleRepository.delete(
        new Types.ObjectId(_id)
      );
      return schedule;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }
}
