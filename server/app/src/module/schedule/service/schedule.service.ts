import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit
} from '@nestjs/common';
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
import { UserDto } from 'src/module/auth/dto/user.dto';
import { HttpService } from '@nestjs/axios';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Observable } from 'rxjs';

// NotificationService gRPC 인터페이스 정의
interface NotificationService {
  sendNotification(request: {
    fcm_token: string;
    title: string;
    body: string;
    data: Record<string, string>;
  }): Observable<{
    success: boolean;
    message: string;
    timestamp: string;
  }>;
}

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Seoul');

@Injectable()
export class ScheduleService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'notification',
      protoPath: join(__dirname, 'proto/notification.proto'),
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      },
      url: process.env.NOTIFICATION_GRPC_URL // 0.0.0.0 대신 127.0.0.1 사용
    }
  })
  private readonly grpcClient: ClientGrpc;
  private notificationService: NotificationService;

  constructor(
    @Inject('SCHEDULE_REPOSITORY')
    private readonly scheduleRepository: ScheduleRepository,
    @Inject(CACHE_GENERATOR)
    private readonly cacheGenerator: CACHE_GENERATOR,
    @Inject('WORKSPACE_REPOSITORY')
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly httpService: HttpService
  ) {}

  private readonly logger = new Logger(ScheduleService.name);

  /**
   * ObjectId 유효성 검사 헬퍼 메서드 (진단 정보 포함)
   * @param id 검사할 ID 문자열
   * @param fieldName 필드명 (에러 메시지용)
   * @param methodName 호출한 메서드명 (디버깅용)
   * @throws BadRequestException 유효하지 않은 ObjectId인 경우
   */
  private validateObjectId(
    id: string,
    fieldName: string = 'ID',
    methodName?: string
  ): void {
    // 디버깅 정보 로깅
    const debugInfo = {
      method: methodName || 'unknown',
      field: fieldName,
      receivedValue: id,
      valueType: typeof id,
      valueLength: id?.length || 0,
      timestamp: new Date().toISOString()
    };

    if (!id) {
      this.logger.error(`❌ [${fieldName} 검증 실패] 빈 값 받음`, debugInfo);
      throw new BadRequestException(`${fieldName}가 필요합니다.`);
    }

    if (!Types.ObjectId.isValid(id)) {
      this.logger.error(`❌ [${fieldName} 검증 실패] 잘못된 형식`, debugInfo);
      throw new BadRequestException(`유효하지 않은 ${fieldName} 형식입니다.`);
    }

    // 성공적인 검증도 로깅 (디버깅 모드에서만)
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`✅ [${fieldName} 검증 성공]`, debugInfo);
    }
  }

  /**
   * 여러 ObjectId들을 한번에 검사하는 헬퍼 메서드
   * @param ids ID와 필드명의 배열
   * @param methodName 호출한 메서드명 (디버깅용)
   * @throws BadRequestException 유효하지 않은 ObjectId가 있는 경우
   */
  private validateMultipleObjectIds(
    ids: Array<{ id: string; fieldName: string }>,
    methodName?: string
  ): void {
    for (const { id, fieldName } of ids) {
      this.validateObjectId(id, fieldName, methodName);
    }
  }

  onModuleInit() {
    // gRPC 클라이언트 서비스 초기화
    try {
      this.notificationService =
        this.grpcClient.getService<NotificationService>('NotificationService');
      this.logger.log('gRPC 클라이언트가 초기화되었습니다.');
    } catch (error) {
      this.logger.error('gRPC 클라이언트 초기화 실패:', error);
    }
  }

  async find(
    _id: string,
    year: string,
    month: string,
    week: string,
    day: string
  ): Promise<Schedule[]> {
    try {
      // ObjectId 유효성 검사
      this.validateObjectId(_id, 'Workspace ID', 'find');

      const schedules = await this.scheduleRepository.findByWorkspaceId(
        new Types.ObjectId(_id),
        year,
        month,
        week,
        day
      );

      // _id만 있고 year가 없는 경우 모든 스케줄 반환
      if (!year) {
        return schedules;
      }

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

      // 음력/양력 표시 포함하여 스케줄 추가
      schedules.forEach((schedule) => {
        // 시간 정보 유지하며 날짜 포맷팅
        const formattedStartDate = dayjs(schedule.start_date).format(
          'YYYY-MM-DD HH:mm'
        );
        const formattedEndDate = dayjs(schedule.end_date).format(
          'YYYY-MM-DD HH:mm'
        );
        combinedCalendar.push({
          _id: schedule._id,
          start_date: formattedStartDate,
          end_date: formattedEndDate,
          title: schedule.title,
          memo: schedule.memo,
          participants: schedule.participants,
          is_holiday: false,
          is_anniversary: schedule.is_anniversary,
          repeat_type: schedule.repeat_type,
          calendar_type: schedule.calendar_type
        });
      });

      combinedCalendar.sort(
        (a, b) =>
          new Date(a.date || a.start_date).getTime() -
          new Date(b.date || b.start_date).getTime()
      );

      return combinedCalendar;
    } catch (e) {
      this.logger.error(e);
      // BadRequestException을 그대로 전파
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new HttpException(e, e.status);
    }
  }

  async findById(_id: string): Promise<Schedule> {
    try {
      // ObjectId 유효성 검사
      this.validateObjectId(_id, 'Schedule ID', 'findById');

      const schedule = await this.scheduleRepository.findById(
        new Types.ObjectId(_id)
      );
      return schedule;
    } catch (e) {
      this.logger.error(e);
      // BadRequestException을 그대로 전파
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new HttpException(e, e.status);
    }
  }

  async count(_id: string): Promise<any> {
    try {
      // ObjectId 유효성 검사
      this.validateObjectId(_id, 'Workspace ID', 'count');

      const workspace: any = await this.workspaceRepository.findOneById(
        new Types.ObjectId(_id)
      );
      const master_id: string = String(workspace.master._id);
      const guest_user: any = workspace.users.find(
        (user: any) => user._id.toString() !== master_id.toString()
      );

      // 추가적인 ID 유효성 검사
      this.validateMultipleObjectIds(
        [
          { id: master_id, fieldName: 'Master ID' },
          { id: guest_user._id as string, fieldName: 'Guest User ID' }
        ],
        'count'
      );

      const settingResult = {
        master: {
          name: workspace.master.name,
          tags: workspace.tags.master,
          count: 0
        },
        guest: {
          name: guest_user.name,
          tags: workspace.tags.guest,
          count: 0
        },
        together: {
          name: '함께',
          tags: workspace.tags.together,
          count: 0
        },
        anniversary: {
          name: '기념일',
          tags: workspace.tags.anniversary,
          count: 0
        }
      };

      const master_schedule_count = await this.scheduleRepository.count(
        new Types.ObjectId(_id),
        new Types.ObjectId(master_id),
        new Types.ObjectId(guest_user._id as string),
        CountType.MASTER
      );
      const guest_schedule_count = await this.scheduleRepository.count(
        new Types.ObjectId(_id),
        new Types.ObjectId(master_id),
        new Types.ObjectId(guest_user._id as string),
        CountType.GUEST
      );
      const together_schedule_count = await this.scheduleRepository.count(
        new Types.ObjectId(_id),
        new Types.ObjectId(master_id),
        new Types.ObjectId(guest_user._id as string),
        CountType.TOGETHER
      );
      const anniversary_schedule_count = await this.scheduleRepository.count(
        new Types.ObjectId(_id),
        new Types.ObjectId(master_id),
        new Types.ObjectId(guest_user._id as string),
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
      // BadRequestException을 그대로 전파
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new HttpException(e.message, e.status || 500);
    }
  }

  async insert(
    user: UserDto,
    _id: string,
    body: CreateScheduleRequestDto
  ): Promise<Schedule> {
    try {
      // ObjectId 유효성 검사
      this.validateObjectId(_id, 'Workspace ID', 'insert');
      this.validateObjectId(user._id, 'User ID', 'insert');

      const schedule = await this.scheduleRepository.insert(
        new Types.ObjectId(_id),
        body
      );

      // 워크스페이스에서 유저 정보 가져오기 (users 필드 populate)
      const workspace = await this.workspaceRepository.findOneById(
        new Types.ObjectId(_id),
        { populate: ['users'] }
      );

      if (!workspace) {
        throw new HttpException('Workspace not found', 404);
      }

      const current_user_id = user._id;

      // 워크스페이스의 모든 유저에게 알림 전송
      for (const workspaceUser of workspace.users) {
        const userObj = workspaceUser as any; // 타입 캐스팅

        // MongoDB에서 populate된 유저 객체인지 확인
        if (typeof userObj !== 'object' || !userObj) {
          this.logger.warn(
            `유효하지 않은 유저 객체: ${JSON.stringify(workspaceUser)}`
          );
          continue;
        }

        // 워크스페이스 유저 정보 디버깅
        this.logger.debug(
          `워크스페이스 유저 정보: ${JSON.stringify({
            id: userObj._id,
            name: userObj.name,
            fcm_token: userObj.fcm_token ? '있음' : '없음',
            calendar_type: userObj.calendar_type,
            push_enabled: userObj.push_enabled,
            alarm_type: body.is_anniversary
              ? 'anniversary_alarm'
              : 'schedule_alarm',
            alarm_enabled: body.is_anniversary
              ? userObj.anniversary_alarm
              : userObj.schedule_alarm
          })}`
        );

        // 알림 조건 확인
        if (
          userObj.fcm_token &&
          userObj.fcm_token.trim() !== '' && // FCM 토큰이 빈 문자열이 아닌지 확인
          userObj.push_enabled &&
          (body.is_anniversary
            ? userObj.anniversary_alarm
            : userObj.schedule_alarm)
        ) {
          // 본인인 경우 다른 메시지 전송
          const isCurrentUser = userObj._id.toString() === current_user_id;
          const notificationTitle = isCurrentUser
            ? `새로운 스케줄이 등록되었습니다`
            : `${user.name}님의 새로운 스케줄을 등록`;

          // gRPC를 통한 알림 전송 시도
          try {
            // 알림 요청 객체 생성
            const notificationRequest = {
              fcm_token: userObj.fcm_token,
              title: notificationTitle,
              body: `${body.title}`,
              data: {
                scheduleId: schedule._id.toString(),
                type: 'NEW_SCHEDULE'
              }
            };

            this.notificationService
              .sendNotification(notificationRequest)
              .subscribe({
                next: (response) => {
                  this.logger.log(
                    `gRPC 알림 전송 결과 (${userObj._id}): ${JSON.stringify(response)}`
                  );
                  if (!response.success) {
                    this.logger.warn(
                      `gRPC 알림 전송 실패 (${userObj._id}), HTTP로 폴백`
                    );
                    this.sendHttpNotificationFallback(
                      userObj.fcm_token,
                      notificationTitle,
                      body.title,
                      {
                        scheduleId: schedule._id.toString(),
                        type: 'NEW_SCHEDULE'
                      }
                    );
                  }
                },
                error: (error) => {
                  this.logger.error(
                    `gRPC 알림 전송 중 오류 발생 (${userObj._id}):`,
                    error
                  );
                  // gRPC 호출 실패 시 HTTP 폴백
                  this.logger.warn('HTTP 폴백 시도');
                  this.sendHttpNotificationFallback(
                    userObj.fcm_token,
                    notificationTitle,
                    body.title,
                    {
                      scheduleId: schedule._id.toString(),
                      type: 'NEW_SCHEDULE'
                    }
                  );
                }
              });
          } catch (error) {
            this.logger.error(
              `알림 전송 준비 중 오류 발생 (${userObj._id}):`,
              error
            );
          }
        }
      }

      return schedule;
    } catch (e) {
      this.logger.error(e);
      // BadRequestException을 그대로 전파
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new HttpException(
        e.message || 'Internal server error',
        e.status || 500
      );
    }
  }

  // HTTP를 통한 알림 전송 (폴백 메서드)
  private sendHttpNotificationFallback(
    fcmToken: string,
    title: string,
    body: string,
    data: Record<string, string>
  ) {
    try {
      const notificationServerUrl =
        process.env.NOTIFICATION_SERVER_URL || 'http://localhost:3100';

      this.httpService
        .post(`${notificationServerUrl}/notification/send`, {
          fcm_token: fcmToken,
          title,
          body,
          data
        })
        .subscribe({
          next: (response) => {
            this.logger.log(
              `HTTP 알림 전송 성공: ${JSON.stringify(response.data)}`
            );
          },
          error: (error) => {
            this.logger.error('HTTP 알림 전송 실패:', error);
          }
        });
    } catch (error) {
      this.logger.error('HTTP 알림 요청 준비 중 오류 발생:', error);
    }
  }

  async update(_id: string, body: UpdateScheduleRequestDto): Promise<Schedule> {
    try {
      // ObjectId 유효성 검사
      this.validateObjectId(_id, 'Schedule ID', 'update');

      const schedule = await this.scheduleRepository.update(
        new Types.ObjectId(_id),
        body
      );
      return schedule;
    } catch (e) {
      this.logger.error(e);
      // BadRequestException을 그대로 전파
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new HttpException(e, e.status);
    }
  }

  async delete(_id: string): Promise<Schedule> {
    try {
      // ObjectId 유효성 검사
      this.validateObjectId(_id, 'Schedule ID', 'delete');

      const schedule = await this.scheduleRepository.delete(
        new Types.ObjectId(_id)
      );
      return schedule;
    } catch (e) {
      this.logger.error(e);
      // BadRequestException을 그대로 전파
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new HttpException(e, e.status);
    }
  }
}
