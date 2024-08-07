import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UseInterceptors,
  Injectable,
  HttpException
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';

interface ClassConstructor {
  new (...args: any[]): NonNullable<unknown>;
}

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: any) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    return handler.handle().pipe(
      map((data) => {
        try {
          if (data && data.items) {
            data.items = plainToInstance(this.dto, data.items, {
              excludeExtraneousValues: true
            });
          } else {
            data = plainToInstance(this.dto, data, {
              excludeExtraneousValues: true
            });
          }
          return data;
        } catch (e) {
          console.error('Error during serialization:', e);
          throw new HttpException(e, e.status);
        }
      })
    );
  }
}
