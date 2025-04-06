import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Cron } from '@nestjs/schedule';
import { CACHE_GENERATOR } from '../../../lib/cache.module';
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
    // 한국 주요 도시들의 OpenWeatherMap city ID
    const city_ids =
      '1835848,1835553,1838524,1841811,1843561,1845604,1845457,1845136,1841598,1842616,1842225,1842944,1843137,1845759,1846266,1835895,1835327,1839726,1836553,1833742,1835895,1838722,1839652,1840886,1840982,1841597,1844088,1846052,1846095,1846114,1846149,1846265,1846326,1846355,1846898,1847050,1835329,1835235,1835447,1835518,1835224,1835967,1836208,1836830,1837055,1837217,1837660,1838519,1838722,1839071,1839652,1840179,1840536,1840886,1840982,1841142,1841598,1841603,1841775,1841976,1842025,1842485,1842518,1842800,1842859,1842936,1842944,1843082,1843137,1843561,1843841,1843847,1844045,1844088,1844411,1844533,1844751,1844788,1845033,1845105,1845136,1845457,1845519,1845604,1845759,1846052,1846095,1846114,1846149,1846266,1846355,1846516,1846735,1846898,1846912,1846918,1846986,1847050,1835648,1835967,1836553,1838073,1839071,1839237,1840536';

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
      if (!city) {
        const keys = await this.cacheGenerator.keysCache(`weather:*`);
        const weatherPromises = Array.isArray(keys)
          ? keys.map((key) => this.cacheGenerator.getCache(key))
          : [];

        // 3. 모든 결과를 기다림
        const weatherResults = await Promise.all(weatherPromises);

        return weatherResults;
      }
      const weather = await this.cacheGenerator.getCache(`weather:${city}`);
      return weather;
    } catch (e) {
      this.logger.error(e);
      throw new HttpException(e, e.status);
    }
  }
}
