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
import { TransactionService } from '../service/transaction.service';
import { JwtAuthGuard } from '../../auth/guard';
import { ResponseDto } from '../../../common/dto/response.dto';
import { CreateTransactionRequestDto } from '../dto/request/create-transaction.request.dto';
import { UserDto } from '../../auth/dto/user.dto';
import { User } from '../../../common/decorator/user.decorator';
import { Serialize } from '../../../interceptor/serialize.interceptor';
import { TransactionDto } from '../dto/transaction.dto';

@ApiTags('Transaction')
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @ApiOperation({ summary: '거래 생성' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '거래 생성 성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(TransactionDto)
  @Post(':workspace_id')
  async create(
    @User() user: UserDto,
    @Param('workspace_id') workspace_id: string,
    @Body() body: CreateTransactionRequestDto
  ) {
    console.log('create', user, workspace_id, body);
    return this.transactionService.create(user, workspace_id, body);
  }

  @ApiOperation({ summary: '워크스페이스별 거래 목록 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '거래 목록 조회 성공'
  })
  @ApiParam({
    name: 'workspace_id',
    description: '워크스페이스 ID'
  })
  @ApiQuery({
    name: 'start_date',
    description: '시작 날짜 (YYYY-MM-DD)',
    required: false
  })
  @ApiQuery({
    name: 'end_date',
    description: '종료 날짜 (YYYY-MM-DD)',
    required: false
  })
  @ApiQuery({
    name: 'type',
    description: '거래 유형 (income/expense)',
    required: false
  })
  @ApiQuery({
    name: 'category',
    description: '카테고리',
    required: false
  })
  @ApiQuery({
    name: 'limit',
    description: '조회 개수 제한',
    required: false,
    type: 'number'
  })
  @ApiQuery({
    name: 'skip',
    description: '건너뛸 개수',
    required: false,
    type: 'number'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(TransactionDto)
  @Get(':workspace_id')
  async findAll(
    @Param('workspace_id') workspace_id: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ) {
    return this.transactionService.findAll(workspace_id, {
      start_date,
      end_date,
      type,
      category,
      limit,
      skip
    });
  }

  @ApiOperation({ summary: '거래 상세 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '거래 상세 조회 성공'
  })
  @ApiParam({
    name: 'id',
    description: '거래 ID'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(TransactionDto)
  @Get('detail/:id')
  async findById(@Param('id') id: string) {
    return this.transactionService.findById(id);
  }

  @ApiOperation({ summary: '거래 수정' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '거래 수정 성공'
  })
  @ApiParam({
    name: 'id',
    description: '거래 ID'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(TransactionDto)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<CreateTransactionRequestDto>
  ) {
    return this.transactionService.update(id, body);
  }

  @ApiOperation({ summary: '거래 삭제' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '거래 삭제 성공'
  })
  @ApiParam({
    name: 'id',
    description: '거래 ID'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.transactionService.delete(id);
  }

  @ApiOperation({ summary: '월별 통계 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '월별 통계 조회 성공'
  })
  @ApiParam({
    name: 'workspace_id',
    description: '워크스페이스 ID'
  })
  @ApiQuery({
    name: 'year',
    description: '연도',
    type: 'number'
  })
  @ApiQuery({
    name: 'month',
    description: '월',
    type: 'number'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':workspace_id/stats/monthly')
  async getMonthlyStats(
    @Param('workspace_id') workspace_id: string,
    @Query('year') year: number,
    @Query('month') month: number
  ) {
    return this.transactionService.getMonthlyStats(workspace_id, year, month);
  }

  @ApiOperation({ summary: '유형별 총 금액 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '유형별 총 금액 조회 성공'
  })
  @ApiParam({
    name: 'workspace_id',
    description: '워크스페이스 ID'
  })
  @ApiQuery({
    name: 'type',
    description: '거래 유형 (income/expense)'
  })
  @ApiQuery({
    name: 'start_date',
    description: '시작 날짜 (YYYY-MM-DD)',
    required: false
  })
  @ApiQuery({
    name: 'end_date',
    description: '종료 날짜 (YYYY-MM-DD)',
    required: false
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':workspace_id/stats/total')
  async getTotalAmountByType(
    @Param('workspace_id') workspace_id: string,
    @Query('type') type: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string
  ) {
    return this.transactionService.getTotalAmountByType(
      workspace_id,
      type as any,
      start_date,
      end_date
    );
  }

  @ApiOperation({ summary: '기간별 거래 목록 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '기간별 거래 목록 조회 성공'
  })
  @ApiParam({
    name: 'workspace_id',
    description: '워크스페이스 ID'
  })
  @ApiQuery({
    name: 'start_date',
    description: '시작 날짜 (YYYY-MM-DD)'
  })
  @ApiQuery({
    name: 'end_date',
    description: '종료 날짜 (YYYY-MM-DD)'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(TransactionDto)
  @Get(':workspace_id/range')
  async getDateRangeTransactions(
    @Param('workspace_id') workspace_id: string,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string
  ) {
    console.log('getDateRangeTransactions', workspace_id, start_date, end_date);
    return this.transactionService.getDateRangeTransactions(
      workspace_id,
      start_date,
      end_date
    );
  }
}
