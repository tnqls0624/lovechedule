import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler
} from '@nestjs/common';
import dayjs from 'dayjs';
import { Observable } from 'rxjs';
import { map, timeout } from 'rxjs/operators';

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(5000),
      map((data: any) => {
        return {
          success: true,
          data,
          timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss')
        };
      })
    );
  }
}
