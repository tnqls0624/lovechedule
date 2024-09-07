import { Controller, Get, Param } from '@nestjs/common';
import { WeatherService } from '../service/weather.service';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags
} from '@nestjs/swagger';
import { ResponseDto } from '../../common/dto/response.dto';

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
  @ApiParam({
    type: 'string',
    name: 'city',
    example: 'Seoul-si'
  })
  // @Serialize(WorkspaceResponseDto)
  @Get('/:city')
  findByCity(@Param('city') city: string) {
    return this.weatherService.getWeather(city);
  }
}
