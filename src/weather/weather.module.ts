import { Module, Provider } from '@nestjs/common';
import { WeatherController } from './controller/weather.controller';
import { WeatherService } from './service/weather.service';

const infrastructure: Provider[] = [
  // {
  //   provide: 'WEATHER_REPOSITORY',
  //   useClass: WeatherRepositoryImplement
  // }
];

const services = [WeatherService];

const controller = [WeatherController];

@Module({
  controllers: [...controller],
  providers: [...services, ...infrastructure],
  exports: [...services, ...infrastructure]
})
export class WeatherModule {}
