import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Cron } from '@nestjs/schedule';
import { CACHE_GENERATOR } from '../../lib/cache.module';
import * as process from 'node:process';

@Injectable()
export class WeatherService {
  constructor(
    @Inject(CACHE_GENERATOR)
    private readonly cacheGenerator: CACHE_GENERATOR
  ) {}
  private readonly logger = new Logger(WeatherService.name);

  @Cron('0 * * * *')
  async handleCron() {
    const city_ids =
      '1835848,1835953,1838716,1842485,1841988,1833788,1835553,1846918';

    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/group?id=${city_ids}&lang=kr&units=metric&appid=${process.env.WEATHER_API_KEY}`
      );

      const weather_data = res.data;

      for (const city of weather_data.list) {
        const city_name = city.name;
        const cache_key = `weather:${city_name}`;
        await this.cacheGenerator.setCache(cache_key, city, 3600); // TTL 3600초 (1시간)
      }

      this.logger.log('Weather data has been updated and cached.');
    } catch (error) {
      this.logger.error('Error fetching weather data:', error);
    }
  }

  async getWeather(city: string) {
    try {
      const weather = await this.cacheGenerator.getCache(`weather:${city}`);
      return weather;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }
}
