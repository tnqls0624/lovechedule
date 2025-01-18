import { Module, Provider } from '@nestjs/common';
import { WeatherController } from './controller/weather.controller';
import { WeatherService } from './service/weather.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '../lib/cache.module';

const infrastructure: Provider[] = [
  // {
  //   provide: 'WEATHER_REPOSITORY',
  //   useClass: WeatherRepositoryImplement
  // }
];

const services = [WeatherService];

const controller = [WeatherController];

@Module({
  imports: [ScheduleModule.forRoot(), CacheModule],
  controllers: [...controller],
  providers: [...services, ...infrastructure],
  exports: [...services, ...infrastructure]
})
export class WeatherModule {}
