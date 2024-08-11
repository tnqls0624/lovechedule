import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { Schedule } from '../schema/schedule.schema';
import { ScheduleRepository } from '../interface/schedule.repository';
import { CreateScheduleRequestDto } from '../dto/request/create-schedule.request.dto';
import { UpdateScheduleRequestDto } from '../dto/request/update-schedule.request.dto';
import { CACHE_GENERATOR } from '../../../lib/cache.module';
import dayjs from 'dayjs';
import { UpdateScheduleStatusRequestDto } from '../dto/request/update-schedule-status.request.dto';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul');

@Injectable()
export class ScheduleService {
  constructor(
    @Inject('SCHEDULE_REPOSITORY')
    private scheduleRepository: ScheduleRepository,
    @Inject(CACHE_GENERATOR) private readonly cacheGenerator: CACHE_GENERATOR
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
        _id,
        year,
        month,
        week,
        day
      );
      const holiday_calendar: any = await this.cacheGenerator.getCache(
        `calendar:${year}`
      );
      let current_holiday: any;

      if (year && month && day) {
        const formatted_month = month.toString().padStart(2, '0');
        const formatted_day = day.toString().padStart(2, '0');
        const year_month_day = `${year}${formatted_month}${formatted_day}`;

        current_holiday = holiday_calendar.filter(
          (holiday: { locdate: string }) => {
            return holiday.locdate.toString() === year_month_day;
          }
        );
      } else if (year && month && week) {
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
      } else if (year && month) {
        const formatted_month = month.padStart(2, '0');
        const year_month = `${year}${formatted_month}`;

        current_holiday = holiday_calendar.filter(
          (holiday: { locdate: number }) => {
            return holiday.locdate.toString().startsWith(year_month);
          }
        );
      } else if (year) {
        current_holiday = holiday_calendar.filter(
          (holiday: { locdate: string }) => {
            return holiday.locdate.toString().startsWith(year);
          }
        );
      }
      const combinedCalendar = [];

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
          date: dayjs(schedule.date).format('YYYY-MM-DD'),
          title: schedule.title,
          description: schedule.description,
          participants: schedule.participants,
          tags: schedule.tags,
          is_holiday: false
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

  async insert(_id: string, body: CreateScheduleRequestDto): Promise<Schedule> {
    try {
      const schedule = await this.scheduleRepository.insert(_id, body);
      return schedule;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async update(_id: string, body: UpdateScheduleRequestDto): Promise<Schedule> {
    try {
      const schedule = await this.scheduleRepository.update(_id, body);
      return schedule;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }

  async updateScheduleIsDone(
    _id: string,
    body: UpdateScheduleStatusRequestDto
  ): Promise<Schedule> {
    try {
      const schedule = await this.scheduleRepository.updateScheduleIsDone(
        _id,
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
      const schedule = await this.scheduleRepository.delete(_id);
      return schedule;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }
}
