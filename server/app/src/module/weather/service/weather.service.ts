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
      '1835847', // 서울 (Seoul)
      '1835553', // 수원 (Suwon)
      '1838519', // 부산 (Busan)
      '1841808', // 광주 (Gwangju)
      '1843564', // 인천 (Incheon)
      '1845457', // 전주 (Jeonju)
      '1846266', // 제주 (Jeju)
      '1841603', // 경주 (Gyeongju)
      '1843491', // 익산 (Iksan)
      '1846326', // 창원 (Changwon)
      '1897000', // 성남 (Seongnam)
      '1835329', // 대구 (Daegu)
      '1839071', // 포항 (Pohang)
      '1833742', // 울산 (Ulsan)
      '1838716', // 부천 (Bucheon)
      '1838343', // 평택 (Pyeongtaek)
      '1897122', // 남양주 (Namyangju)
      '1832157', // 여수 (Yeosu)
      '1846052', // 진주 (Jinju)
      '1845759', // 천안 (Cheonan)
      '1832828', // 양산 (Yangsan)
      '1845136', // 춘천 (Chuncheon)
      '1846918', // 안산 (Ansan)
      '1846898', // 안양 (Anyang)
      '1835235', // 대전 (Daejeon)
      '1841066', // 목포 (Mokpo)
      '1835648' // 순천 (Suncheon)
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
          `https://api.openweathermap.org/data/3.0/group?id=${cityIdsString}&lang=kr&units=metric&appid=${process.env.WEATHER_API_KEY}`
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
