import { HttpException, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  async getWeather() {
    try {
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }
}
