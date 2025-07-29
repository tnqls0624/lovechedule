import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Req
} from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { TransactionService } from '../../transaction/service/transaction.service';
import { JwtAuthGuard } from '../../auth/guard';
import { ResponseDto } from '../../../common/dto/response.dto';
import { CreateTransactionRequestDto } from '../../transaction/dto/request/create-transaction.request.dto';
import { UserDto } from '../../auth/dto/user.dto';
import { User } from '../../../common/decorator/user.decorator';
import { Serialize } from '../../../interceptor/serialize.interceptor';
import { TransactionDto } from '../../transaction/dto/transaction.dto';
import { CategoryService } from '../service/category.service';

// dayjs 플러그인 활성화
dayjs.extend(utc);
dayjs.extend(timezone);

// 한국 시간대 설정
const KST_TIMEZONE = 'Asia/Seoul';

@ApiTags('Budget')
@Controller('budget')
export class BudgetController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly categoryService: CategoryService
  ) {}

  @ApiOperation({ summary: '연월별 가계부 데이터 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '월별 가계부 데이터 조회 성공'
  })
  @ApiQuery({
    name: 'workspace_id',
    description: '워크스페이스 ID'
  })
  @ApiQuery({
    name: 'year',
    description: '연도',
    type: 'string'
  })
  @ApiQuery({
    name: 'month',
    description: '월 (생략 시 연간 데이터)',
    type: 'string',
    required: false
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMonthlyBudgetData(
    @Req() req: any,
    @Query('workspace_id') workspace_id: string,
    @Query('year') year: string,
    @Query('month') month?: string
  ) {
    // 필수 파라미터 검증
    if (!workspace_id) {
      throw new BadRequestException('workspace_id parameter is required');
    }

    // year가 없으면 현재 연도를 기본값으로 사용 (한국 시간 기준)
    const currentYear = dayjs().tz(KST_TIMEZONE).year().toString();
    const yearToUse = year || currentYear;

    // 연도 유효성 검증
    const yearNum = parseInt(yearToUse, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      throw new BadRequestException(`Invalid year parameter: ${yearToUse}`);
    }

    // 월이 없으면 연간 데이터 반환
    if (!month) {
      return this.getYearlyBudgetData(workspace_id, yearNum);
    }

    // 월 유효성 검증
    const monthNum = parseInt(month, 10);

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new BadRequestException(
        `Invalid month parameter: ${month} -> ${monthNum}`
      );
    }

    // dayjs를 사용한 정확한 날짜 계산 (한국 시간대)
    const startDate = dayjs
      .tz(
        `${yearNum}-${monthNum.toString().padStart(2, '0')}-01 00:00:00`,
        KST_TIMEZONE
      )
      .format('YYYY-MM-DD');
    const endDate = dayjs
      .tz(`${yearNum}-${monthNum.toString().padStart(2, '0')}-01`, KST_TIMEZONE)
      .endOf('month')
      .format('YYYY-MM-DD');

    const transactions = await this.transactionService.findAll(workspace_id, {
      start_date: startDate,
      end_date: endDate
    });

    const stats = await this.transactionService.getMonthlyStats(
      workspace_id,
      yearNum,
      monthNum
    );

    return {
      year: yearNum,
      month: monthNum,
      workspace_id,
      transactions,
      total_income: stats.total_income,
      total_expense: stats.total_expense,
      balance: stats.total_income - stats.total_expense,
      category_stats: stats.category_stats,
      transaction_count: transactions.length
    };
  }

  // 연간 데이터를 위한 별도 메서드
  private async getYearlyBudgetData(workspace_id: string, year: number) {
    const yearlyData = [];

    // 12개월 데이터를 모두 가져오기
    for (let month = 1; month <= 12; month++) {
      const stats = await this.transactionService.getMonthlyStats(
        workspace_id,
        year,
        month
      );
      const monthStartDate = dayjs
        .tz(
          `${year}-${month.toString().padStart(2, '0')}-01 00:00:00`,
          KST_TIMEZONE
        )
        .toDate();
      const monthEndDate = dayjs
        .tz(`${year}-${month.toString().padStart(2, '0')}-01`, KST_TIMEZONE)
        .endOf('month')
        .toDate();

      const transactions = await this.transactionService.findAll(workspace_id, {
        start_date: monthStartDate.toISOString(),
        end_date: monthEndDate.toISOString()
      });

      yearlyData.push({
        month,
        total_income: stats.total_income,
        total_expense: stats.total_expense,
        balance: stats.total_income - stats.total_expense,
        transaction_count: transactions.length,
        category_stats: stats.category_stats
      });
    }

    // 연간 합계 계산
    const yearlyTotalIncome = yearlyData.reduce(
      (sum, data) => sum + data.total_income,
      0
    );
    const yearlyTotalExpense = yearlyData.reduce(
      (sum, data) => sum + data.total_expense,
      0
    );
    const yearlyBalance = yearlyTotalIncome - yearlyTotalExpense;
    const totalTransactions = yearlyData.reduce(
      (sum, data) => sum + data.transaction_count,
      0
    );

    return {
      year,
      workspace_id,
      type: 'yearly',
      monthly_data: yearlyData,
      yearly_summary: {
        total_income: yearlyTotalIncome,
        total_expense: yearlyTotalExpense,
        balance: yearlyBalance,
        total_transactions: totalTransactions,
        avg_monthly_income: yearlyTotalIncome / 12,
        avg_monthly_expense: yearlyTotalExpense / 12
      }
    };
  }

  @ApiOperation({ summary: '월별 가계부 통계 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '월별 가계부 통계 조회 성공'
  })
  @ApiQuery({
    name: 'workspace_id',
    description: '워크스페이스 ID'
  })
  @ApiQuery({
    name: 'year',
    description: '연도',
    type: 'string'
  })
  @ApiQuery({
    name: 'month',
    description: '월 (생략 시 연간 통계)',
    type: 'string',
    required: false
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getBudgetStats(
    @Req() req: any,
    @Query('workspace_id') workspace_id: string,
    @Query('year') year: string,
    @Query('month') month?: string
  ) {
    // 필수 파라미터 검증
    if (!workspace_id) {
      throw new BadRequestException('workspace_id parameter is required');
    }

    // year가 없으면 현재 연도를 기본값으로 사용 (한국 시간 기준)
    const currentYear = dayjs().tz(KST_TIMEZONE).year().toString();
    const yearToUse = year || currentYear;

    // 연도 유효성 검증
    const yearNum = parseInt(yearToUse, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      throw new BadRequestException(`Invalid year parameter: ${yearToUse}`);
    }

    // 월이 없으면 연간 통계 반환
    if (!month) {
      return this.getYearlyStats(workspace_id, yearNum);
    }

    // 월 유효성 검증
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new BadRequestException('Invalid month parameter');
    }

    const stats = await this.transactionService.getMonthlyStats(
      workspace_id,
      yearNum,
      monthNum
    );

    // 이전 달 데이터와 비교를 위한 데이터
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;

    const prevStats = await this.transactionService.getMonthlyStats(
      workspace_id,
      prevYear,
      prevMonth
    );

    // 증감률 계산
    const incomeChange =
      prevStats.total_income > 0
        ? ((stats.total_income - prevStats.total_income) /
            prevStats.total_income) *
          100
        : 0;
    const expenseChange =
      prevStats.total_expense > 0
        ? ((stats.total_expense - prevStats.total_expense) /
            prevStats.total_expense) *
          100
        : 0;

    return {
      current_month: {
        year: yearNum,
        month: monthNum,
        total_income: stats.total_income,
        total_expense: stats.total_expense,
        balance: stats.total_income - stats.total_expense,
        category_stats: stats.category_stats
      },
      previous_month: {
        year: prevYear,
        month: prevMonth,
        total_income: prevStats.total_income,
        total_expense: prevStats.total_expense,
        balance: prevStats.total_income - prevStats.total_expense
      },
      comparison: {
        income_change: incomeChange,
        expense_change: expenseChange,
        balance_change:
          stats.total_income -
          stats.total_expense -
          (prevStats.total_income - prevStats.total_expense)
      }
    };
  }

  // 연간 통계를 위한 별도 메서드
  private async getYearlyStats(workspace_id: string, year: number) {
    const monthlyStats = [];

    // 12개월 통계를 모두 가져오기
    for (let month = 1; month <= 12; month++) {
      const stats = await this.transactionService.getMonthlyStats(
        workspace_id,
        year,
        month
      );
      monthlyStats.push({
        month,
        total_income: stats.total_income,
        total_expense: stats.total_expense,
        balance: stats.total_income - stats.total_expense,
        category_stats: stats.category_stats
      });
    }

    // 연간 합계 계산
    const yearlyTotalIncome = monthlyStats.reduce(
      (sum, data) => sum + data.total_income,
      0
    );
    const yearlyTotalExpense = monthlyStats.reduce(
      (sum, data) => sum + data.total_expense,
      0
    );
    const yearlyBalance = yearlyTotalIncome - yearlyTotalExpense;

    // 이전 연도와 비교
    const prevYear = year - 1;
    const prevYearStats = [];
    for (let month = 1; month <= 12; month++) {
      const stats = await this.transactionService.getMonthlyStats(
        workspace_id,
        prevYear,
        month
      );
      prevYearStats.push(stats);
    }

    const prevYearTotalIncome = prevYearStats.reduce(
      (sum, stats) => sum + stats.total_income,
      0
    );
    const prevYearTotalExpense = prevYearStats.reduce(
      (sum, stats) => sum + stats.total_expense,
      0
    );

    // 증감률 계산
    const incomeChange =
      prevYearTotalIncome > 0
        ? ((yearlyTotalIncome - prevYearTotalIncome) / prevYearTotalIncome) *
          100
        : 0;
    const expenseChange =
      prevYearTotalExpense > 0
        ? ((yearlyTotalExpense - prevYearTotalExpense) / prevYearTotalExpense) *
          100
        : 0;

    return {
      type: 'yearly_stats',
      current_year: {
        year,
        total_income: yearlyTotalIncome,
        total_expense: yearlyTotalExpense,
        balance: yearlyBalance,
        monthly_data: monthlyStats
      },
      previous_year: {
        year: prevYear,
        total_income: prevYearTotalIncome,
        total_expense: prevYearTotalExpense,
        balance: prevYearTotalIncome - prevYearTotalExpense
      },
      comparison: {
        income_change: incomeChange,
        expense_change: expenseChange,
        balance_change:
          yearlyBalance - (prevYearTotalIncome - prevYearTotalExpense)
      }
    };
  }

  @ApiOperation({ summary: '연간 가계부 요약 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '연간 가계부 요약 조회 성공'
  })
  @ApiQuery({
    name: 'workspace_id',
    description: '워크스페이스 ID'
  })
  @ApiQuery({
    name: 'year',
    description: '연도',
    type: 'number'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('yearly')
  async getYearlyBudgetSummary(
    @Req() req: any,
    @Query('workspace_id') workspace_id: string,
    @Query('year') year: string
  ) {
    // 필수 파라미터 검증
    if (!workspace_id) {
      throw new BadRequestException('workspace_id parameter is required');
    }

    // year가 없으면 현재 연도를 기본값으로 사용 (한국 시간 기준)
    const currentYear = dayjs().tz(KST_TIMEZONE).year().toString();
    const yearToUse = year || currentYear;

    // 쿼리 파라미터를 숫자로 변환 및 유효성 검증
    const yearNum = parseInt(yearToUse, 10);

    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      throw new BadRequestException(`Invalid year parameter: ${yearToUse}`);
    }

    const yearlyData = [];

    // 12개월 데이터를 모두 가져오기
    for (let month = 1; month <= 12; month++) {
      const stats = await this.transactionService.getMonthlyStats(
        workspace_id,
        yearNum,
        month
      );
      yearlyData.push({
        month,
        total_income: stats.total_income,
        total_expense: stats.total_expense,
        balance: stats.total_income - stats.total_expense,
        category_count: stats.category_stats.length
      });
    }

    // 연간 합계 계산
    const yearlyTotalIncome = yearlyData.reduce(
      (sum, data) => sum + data.total_income,
      0
    );
    const yearlyTotalExpense = yearlyData.reduce(
      (sum, data) => sum + data.total_expense,
      0
    );
    const yearlyBalance = yearlyTotalIncome - yearlyTotalExpense;

    // 월평균 계산
    const avgMonthlyIncome = yearlyTotalIncome / 12;
    const avgMonthlyExpense = yearlyTotalExpense / 12;

    return {
      year: yearNum,
      workspace_id,
      monthly_data: yearlyData,
      yearly_summary: {
        total_income: yearlyTotalIncome,
        total_expense: yearlyTotalExpense,
        balance: yearlyBalance,
        avg_monthly_income: avgMonthlyIncome,
        avg_monthly_expense: avgMonthlyExpense
      }
    };
  }

  // ==================== 카테고리 관련 엔드포인트 ====================

  @ApiOperation({ summary: '워크스페이스에서 사용된 카테고리 목록 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '사용된 카테고리 목록 조회 성공'
  })
  @ApiQuery({
    name: 'workspace_id',
    description: '워크스페이스 ID'
  })
  @ApiQuery({
    name: 'type',
    description: '거래 유형 (income, expense, all)',
    required: false,
    enum: ['income', 'expense', 'all']
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('categories/used')
  async getUsedCategories(
    @Req() req: any,
    @Query('workspace_id') workspace_id: string,
    @Query('type') type?: string
  ) {
    if (!workspace_id) {
      throw new BadRequestException('workspace_id parameter is required');
    }

    const transactions = await this.transactionService.findAll(workspace_id);
    const categoryStats = new Map<
      string,
      {
        category: string;
        type: string;
        count: number;
        total_amount: number;
        last_used: Date;
      }
    >();

    transactions.forEach((transaction) => {
      if (type && type !== 'all' && transaction.type !== type) {
        return;
      }
      const key = `${transaction.type}_${transaction.category}`;
      const existing = categoryStats.get(key);
      if (existing) {
        existing.count++;
        existing.total_amount += transaction.amount;
        if (new Date(transaction.date) > existing.last_used) {
          existing.last_used = new Date(transaction.date);
        }
      } else {
        categoryStats.set(key, {
          category: transaction.category,
          type: transaction.type,
          count: 1,
          total_amount: transaction.amount,
          last_used: new Date(transaction.date)
        });
      }
    });

    const usedCategories = Array.from(categoryStats.values()).sort(
      (a, b) => b.count - a.count
    );

    const incomeCategories = usedCategories
      .filter((cat) => cat.type === 'income')
      .map((cat) => ({
        name: cat.category,
        count: cat.count,
        total_amount: cat.total_amount,
        last_used: cat.last_used,
        last_used_kst: dayjs(cat.last_used).tz('Asia/Seoul').format()
      }));

    const expenseCategories = usedCategories
      .filter((cat) => cat.type === 'expense')
      .map((cat) => ({
        name: cat.category,
        count: cat.count,
        total_amount: cat.total_amount,
        last_used: cat.last_used,
        last_used_kst: dayjs(cat.last_used).tz('Asia/Seoul').format()
      }));

    return {
      workspace_id,
      filter_type: type || 'all',
      used_categories: {
        income: incomeCategories,
        expense: expenseCategories
      },
      summary: {
        total_income_categories: incomeCategories.length,
        total_expense_categories: expenseCategories.length,
        total_categories: usedCategories.length,
        total_transactions: transactions.length
      }
    };
  }

  @ApiOperation({
    summary: '추천 카테고리 조회 (사용자 생성 + 사용된 카테고리)'
  })
  @ApiOkResponse({
    type: ResponseDto,
    description: '추천 카테고리 조회 성공'
  })
  @ApiQuery({
    name: 'workspace_id',
    description: '워크스페이스 ID'
  })
  @ApiQuery({
    name: 'type',
    description: '거래 유형 (income, expense)',
    enum: ['income', 'expense']
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('categories/suggestions')
  async getSuggestedCategories(
    @Req() req: any,
    @Query('workspace_id') workspace_id: string,
    @Query('type') type: 'income' | 'expense'
  ) {
    if (!workspace_id || !type) {
      throw new BadRequestException(
        'workspace_id and type parameters are required'
      );
    }

    if (!['income', 'expense'].includes(type)) {
      throw new BadRequestException(
        'type must be either "income" or "expense"'
      );
    }

    // 사용자가 생성한 카테고리 가져오기
    const userCategories = await this.categoryService.getCategories(
      workspace_id,
      type
    );

    // 실제 거래에서 사용된 카테고리 가져오기
    const usedCategoriesResponse = await this.getUsedCategories(
      req,
      workspace_id,
      type
    );
    const usedCategories = usedCategoriesResponse.used_categories[type];
    const usedCategoryNames = new Set(usedCategories.map((cat) => cat.name));

    // 추천 카테고리 생성
    const suggestions = [
      // 1. 사용된 카테고리 (사용 빈도순) - 실제 거래 데이터 포함
      ...usedCategories.map((cat) => ({
        id: cat.name.toLowerCase().replace(/\s+/g, '_'),
        name: cat.name,
        icon: '📊',
        color: '#2196F3',
        is_used: true,
        usage_count: cat.count,
        total_amount: cat.total_amount,
        last_used: cat.last_used_kst
      })),

      // 2. 사용되지 않은 사용자 생성 카테고리
      ...userCategories
        .filter((cat) => !usedCategoryNames.has(cat.name))
        .map((cat) => ({
          id: cat._id.toString(),
          name: cat.name,
          icon: cat.icon || '📝',
          color: cat.color || '#9E9E9E',
          is_used: false,
          usage_count: 0,
          total_amount: 0
        }))
    ];

    return {
      workspace_id,
      type,
      suggestions,
      summary: {
        total_suggestions: suggestions.length,
        used_categories: usedCategories.length,
        user_created_categories: userCategories.length,
        unused_user_categories:
          userCategories.length -
          usedCategories.filter((cat) =>
            userCategories.some((userCat) => userCat.name === cat.name)
          ).length
      }
    };
  }

  // ==================== 가계부 거래 생성/수정/삭제 엔드포인트 ====================

  @ApiOperation({ summary: '가계부 거래 생성' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '거래 생성 성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(TransactionDto)
  @Post()
  async createTransaction(
    @User() user: UserDto,
    @Query('workspace_id') workspace_id: string,
    @Body() body: CreateTransactionRequestDto
  ) {
    if (!workspace_id) {
      throw new BadRequestException('workspace_id parameter is required');
    }

    // 거래 생성
    const result = await this.transactionService.create(
      user,
      workspace_id,
      body
    );

    return result;
  }

  @ApiOperation({ summary: '가계부 거래 수정' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '거래 수정 성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(TransactionDto)
  @Put(':id')
  async updateTransaction(
    @Param('id') id: string,
    @Body() body: Partial<CreateTransactionRequestDto>
  ) {
    return this.transactionService.update(id, body);
  }

  @ApiOperation({ summary: '가계부 거래 삭제' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '거래 삭제 성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteTransaction(@Param('id') id: string) {
    return this.transactionService.delete(id);
  }

  @ApiOperation({ summary: '가계부 거래 상세 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '거래 상세 조회 성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Serialize(TransactionDto)
  @Get(':id')
  async getTransactionDetail(@Param('id') id: string) {
    return this.transactionService.findById(id);
  }

  @ApiOperation({ summary: '날짜 범위별 거래 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '날짜 범위별 거래 조회 성공'
  })
  @ApiQuery({
    name: 'start_date',
    description: '시작 날짜 (YYYY-MM-DD)',
    example: '2025-01-01'
  })
  @ApiQuery({
    name: 'end_date',
    description: '종료 날짜 (YYYY-MM-DD)',
    example: '2025-12-31'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':workspace_id/range')
  async getTransactionsByRange(
    @Req() req: any,
    @Param('workspace_id') workspace_id: string,
    @Query('start_date') start_date: string,
    @Query('end_date') end_date: string
  ) {
    // 필수 파라미터 검증
    if (!workspace_id) {
      throw new BadRequestException('workspace_id parameter is required');
    }

    if (!start_date || !end_date) {
      throw new BadRequestException(
        'start_date and end_date parameters are required'
      );
    }

    // 날짜 형식 검증 및 변환
    let startDate: Date;
    let endDate: Date;

    try {
      startDate = dayjs.tz(`${start_date} 00:00:00`, KST_TIMEZONE).toDate();
      endDate = dayjs.tz(`${end_date} 23:59:59`, KST_TIMEZONE).toDate();
    } catch (error) {
      throw new BadRequestException(
        'Invalid date format. Use YYYY-MM-DD format.'
      );
    }

    // 날짜 범위 유효성 검증
    if (startDate > endDate) {
      throw new BadRequestException('start_date must be earlier than end_date');
    }

    // 거래 데이터 조회
    const transactions = await this.transactionService.findAll(workspace_id, {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });

    // 통계 계산
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // 카테고리별 집계
    const categoryStats = new Map<string, { amount: number; count: number }>();

    transactions.forEach((transaction) => {
      const existing = categoryStats.get(transaction.category) || {
        amount: 0,
        count: 0
      };
      categoryStats.set(transaction.category, {
        amount: existing.amount + transaction.amount,
        count: existing.count + 1
      });
    });

    const categoryArray = Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        amount: stats.amount,
        count: stats.count,
        percentage: totalExpense > 0 ? (stats.amount / totalExpense) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      workspace_id,
      date_range: {
        start_date,
        end_date,
        start_date_kst: dayjs(startDate).tz(KST_TIMEZONE).format(),
        end_date_kst: dayjs(endDate).tz(KST_TIMEZONE).format()
      },
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance,
        transaction_count: transactions.length
      },
      transactions,
      category_stats: categoryArray
    };
  }
}
