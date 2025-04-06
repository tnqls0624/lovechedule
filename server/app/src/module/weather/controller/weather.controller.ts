import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from '../service/weather.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { ResponseDto } from '../../../common/dto/response.dto';

@ApiTags('WEATHER')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @ApiOperation({
    summary: 'Weather Find'
  })
  @ApiOkResponse({
    type: ResponseDto
  })
  @ApiBearerAuth()
  @ApiQuery({
    type: 'string',
    name: 'city',
    required: false,
    example: 'Seoul'
  })
  @Get()
  findByCity(@Query('city') city: string) {
    return this.weatherService.getWeather(city);
  }

  @ApiOperation({
    summary: 'Weather Cache Refresh (테스트용)'
  })
  @ApiOkResponse({
    type: ResponseDto
  })
  @ApiBearerAuth()
  @Get('refresh-cache')
  async refreshCache() {
    return this.weatherService.refreshWeatherCache();
  }
}
