import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { ScheduleService } from '../service/schedule.service';
import { ResponseDto } from '../../../common/dto/response.dto';
import { JwtAuthGuard } from '../../auth/guard';
import { Serialize } from '../../../interceptor/serialize.interceptor';
import { CreateScheduleRequestDto } from '../dto/request/create-schedule.request.dto';
import { ScheduleDto } from '../dto/schedule.dto';
import { UpdateScheduleRequestDto } from '../dto/request/update-schedule.request.dto';
import { UpdateScheduleStatusRequestDto } from '../dto/request/update-schedule-status.request.dto';

@ApiTags('Schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @ApiOkResponse({
    type: ResponseDto,
    description: '성공'
  })
  @ApiOperation({ summary: 'Find My Schedule' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  // @Serialize(ScheduleDto)
  @ApiQuery({
    name: 'year',
    example: '2023',
    required: true,
    description: '년'
  })
  @ApiQuery({
    name: 'month',
    example: '6',
    required: false,
    description: '월'
  })
  @ApiQuery({
    name: 'week',
    required: false,
    example: '1',
    description: '주'
  })
  @ApiQuery({
    name: 'day',
    required: false,
    example: '10',
    description: '일'
  })
  @ApiParam({
    type: 'string',
    name: '_id',
    example: 'dsanjkn213nj21k'
  })
  @Get('workspace/:_id')
  find(
    @Param('_id') _id: string,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('week') week: string,
    @Query('day') day: string
  ) {
    return this.scheduleService.find(_id, year, month, week, day);
  }

  @ApiOperation({ summary: 'Create Schedule' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(ScheduleDto)
  @ApiParam({
    type: 'string',
    name: '_id',
    example: 'dsanjkn213nj21k'
  })
  @Post('workspace/:_id')
  insert(@Param('_id') _id: string, @Body() body: CreateScheduleRequestDto) {
    return this.scheduleService.insert(_id, body);
  }

  @ApiOperation({ summary: 'Update Schedule' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    type: 'string',
    name: '_id',
    example: 'dsanjkn213nj21k'
  })
  @Put('/:_id')
  update(@Param('_id') _id: string, @Body() body: UpdateScheduleRequestDto) {
    return this.scheduleService.update(_id, body);
  }

  @ApiOperation({ summary: 'Update Schedule' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    type: 'string',
    name: '_id',
    example: 'dsanjkn213nj21k'
  })
  @Put('/:_id/done')
  updateScheduleIsDone(
    @Param('_id') _id: string,
    @Body() body: UpdateScheduleStatusRequestDto
  ) {
    return this.scheduleService.updateScheduleIsDone(_id, body);
  }

  @ApiOperation({ summary: 'Delete Schedule' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({
    type: 'string',
    name: '_id',
    example: 'dsanjkn213nj21k'
  })
  @Delete('/:_id')
  delete(@Param('_id') _id: string) {
    return this.scheduleService.delete(_id);
  }
}
