import { Controller, Get, Param } from '@nestjs/common';
import { WeatherService } from '../service/weather.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam
} from '@nestjs/swagger';
import { ResponseDto } from '../../common/dto/response.dto';

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
  // @Serialize(WorkspaceResponseDto)
  @Get('/')
  findById() {
    return this.weatherService.getWeather();
  }
}
