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
    const allCityIds = [
      '1835848',
      '1835553',
      '1838524',
      '1841811',
      '1843561',
      '1845604',
      '1845457',
      '1845136',
      '1841598',
      '1842616',
      '1842225',
      '1842944',
      '1843137',
      '1845759',
      '1846266',
      '1835895',
      '1835327',
      '1839726',
      '1836553',
      '1833742',
      '1838722',
      '1839652',
      '1840886',
      '1840982',
      '1841597',
      '1844088',
      '1846052',
      '1846095',
      '1846114',
      '1846149',
      '1846265',
      '1846326',
      '1846355',
      '1846898',
      '1847050',
      '1835329',
      '1835235',
      '1835447',
      '1835518',
      '1835224'
    ];

    // 도시 ID를 20개씩 그룹으로 나눔 (API 제한 고려)
    const chunkSize = 20;
    const cityIdGroups = [];

    for (let i = 0; i < allCityIds.length; i += chunkSize) {
      cityIdGroups.push(allCityIds.slice(i, i + chunkSize));
    }

    try {
      // 각 그룹별로 API 호출
      for (const cityIdGroup of cityIdGroups) {
        const cityIdsString = cityIdGroup.join(',');
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/group?id=${cityIdsString}&lang=kr&units=metric&appid=${process.env.WEATHER_API_KEY}`
        );

        const weather_data = res.data;

        for (const city of weather_data.list) {
          const city_name = city.name;
          const cache_key = `weather:${city_name}`;
          await this.cacheGenerator.setCache(cache_key, city, 3600); // TTL 3600초 (1시간)
        }

        // API 호출 간 약간의 지연 추가 (선택사항)
        await new Promise((resolve) => setTimeout(resolve, 500));
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

  /**
   * 테스트를 위해 날씨 캐시를 수동으로 갱신하는 메소드
   */
  async refreshWeatherCache() {
    try {
      this.logger.log('수동으로 날씨 데이터 갱신 시작');
      await this.handleCron();

      // 캐시된 모든 날씨 키 조회
      const keys = await this.cacheGenerator.keysCache('weather:*');
      const cityNames = Array.isArray(keys)
        ? keys.map((key) => key.replace('weather:', ''))
        : [];

      return {
        success: true,
        message: '날씨 데이터가 성공적으로 갱신되었습니다.',
        cachedCities: cityNames
      };
    } catch (error) {
      this.logger.error('날씨 데이터 수동 갱신 중 오류 발생:', error);
      throw new HttpException(
        {
          success: false,
          message: '날씨 데이터 갱신 중 오류가 발생했습니다.',
          error: error.message
        },
        500
      );
    }
  }
}
