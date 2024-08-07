import { Inject, Logger, Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './module/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './module/auth/auth.module';
import { WorkspaceModule } from './module/workspace/workspace.module';
import { ScheduleModule } from './module/schedule/schedule.module';
import { AlbumModule } from './module/album/album.module';
import { PhotoModule } from './module/photo/photo.module';
import {
  CACHE_GENERATOR,
  CacheModule as CacheStoreModule
} from './lib/cache.module';
import axios from 'axios';
import dayjs from 'dayjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService): Promise<any> => ({
        store: redisStore,
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<string>('REDIS_PORT'),
        ttl: configService.get<string>('REDIS_EXPIRED_AT')
      })
    }),
    MongooseModule.forRoot(process.env.MONGO_URL, {
      connectionName: 'lovechedule'
    }),
    UserModule,
    AuthModule,
    WorkspaceModule,
    ScheduleModule,
    AlbumModule,
    PhotoModule,
    CacheStoreModule
  ],
  controllers: [AppController],
  providers: []
})
export class AppModule implements OnModuleInit {
  constructor(
    @Inject(CACHE_GENERATOR) private readonly cacheGenerator: CACHE_GENERATOR
  ) {}
  private readonly logger = new Logger(AppModule.name);

  async fetchAndCacheYearData(year: number) {
    const cache_key = `calendar:${year}`;
    const cached_data = await this.cacheGenerator.getCache(cache_key);
    if (!cached_data) {
      try {
        const service_key =
          'HKTCByhZ2hJ6CAHKsSkFWkbbKnzP%2BgvJCgusOEqNAIiR1rTnkeu7ZxUaBFm31FXfOlYLPudEniZJTbYGDw%2FrVw%3D%3D';
        const response = await axios.get(
          `http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getHoliDeInfo?solYear=${year}&ServiceKey=${service_key}&_type=json&numOfRows=100`
        );
        const data = response.data.response.body.items.item;
        await this.cacheGenerator.setCache(cache_key, data, 0);
        this.logger.log(`Data for year ${year} cached successfully.`);
      } catch (error) {
        this.logger.error(`Failed to fetch data for year ${year}:`, error);
      }
    } else {
      this.logger.log(`Data for year ${year} is already cached.`);
    }
  }

  async cleanOldCacheData(valid_years: number[]) {
    const keys: any = await this.cacheGenerator.keysCache('calendar:*');
    for (const key of keys) {
      const year = parseInt(key.split(':')[1], 10);
      if (!valid_years.includes(year)) {
        await this.cacheGenerator.delCache(key);
        this.logger.log(`Old cache data for year ${year} has been deleted.`);
      }
    }
  }

  async onModuleInit() {
    this.logger.log('AppModule has been initialized.');

    const current_year = dayjs().year();
    const years_to_fetch = [current_year - 1, current_year, current_year + 1];

    for (const year of years_to_fetch) {
      await this.fetchAndCacheYearData(year);
    }

    await this.cleanOldCacheData(years_to_fetch);
  }
}
