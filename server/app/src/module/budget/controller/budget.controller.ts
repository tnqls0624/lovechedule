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

// dayjs 플러그인 활성화
dayjs.extend(utc);
dayjs.extend(timezone);

// 한국 시간대 설정
const KST_TIMEZONE = 'Asia/Seoul';

@ApiTags('Budget')
@Controller('budget')
export class BudgetController {
  constructor(private readonly transactionService: TransactionService) {}

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

    // 월별 통계 데이터 조회 (디버깅 정보 추가)
    console.log(
      `📊 통계 조회 중 - 워크스페이스: ${workspace_id}, 년: ${yearNum}, 월: ${monthNum}`
    );

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

    console.log(
      'Year 파라미터 처리 (Yearly) - 원본:',
      year,
      '사용할 값:',
      yearToUse
    );

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

  @ApiOperation({ summary: '카테고리별 지출 순위 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '카테고리별 지출 순위 조회 성공'
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
    description: '월 (생략 시 연간 카테고리 통계)',
    type: 'string',
    required: false
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('categories')
  async getCategoryRanking(
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

    // 월이 없으면 연간 카테고리 통계 반환
    if (!month) {
      return this.getYearlyCategoryStats(workspace_id, yearNum);
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

    // 지출 카테고리만 필터링하고 금액 순으로 정렬
    const expenseCategories = stats.category_stats
      .sort((a, b) => b.amount - a.amount)
      .map((category, index) => ({
        rank: index + 1,
        category: category.category,
        amount: category.amount,
        count: category.count,
        percentage:
          stats.total_expense > 0
            ? (category.amount / stats.total_expense) * 100
            : 0
      }));

    return {
      year: yearNum,
      month: monthNum,
      workspace_id,
      total_expense: stats.total_expense,
      categories: expenseCategories
    };
  }

  // 연간 카테고리 통계를 위한 별도 메서드
  private async getYearlyCategoryStats(workspace_id: string, year: number) {
    const monthlyStats = [];
    const categoryMap = new Map<
      string,
      { amount: number; count: number; months: number[] }
    >();

    // 12개월 데이터를 모두 가져오기
    for (let month = 1; month <= 12; month++) {
      const stats = await this.transactionService.getMonthlyStats(
        workspace_id,
        year,
        month
      );
      monthlyStats.push(stats);

      // 카테고리별 집계
      for (const category of stats.category_stats) {
        const existing = categoryMap.get(category.category) || {
          amount: 0,
          count: 0,
          months: []
        };
        categoryMap.set(category.category, {
          amount: existing.amount + category.amount,
          count: existing.count + category.count,
          months: existing.months.includes(month)
            ? existing.months
            : [...existing.months, month]
        });
      }
    }

    // 연간 총 지출 계산
    const totalYearlyExpense = monthlyStats.reduce(
      (sum, stats) => sum + stats.total_expense,
      0
    );

    // 카테고리별 연간 통계 생성
    const yearlyCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([category, stats], index) => ({
        rank: index + 1,
        category,
        amount: stats.amount,
        count: stats.count,
        percentage:
          totalYearlyExpense > 0
            ? (stats.amount / totalYearlyExpense) * 100
            : 0,
        active_months: stats.months.length,
        avg_monthly_amount: stats.amount / 12
      }));

    return {
      type: 'yearly_categories',
      year,
      workspace_id,
      total_expense: totalYearlyExpense,
      categories: yearlyCategories,
      summary: {
        total_categories: yearlyCategories.length,
        avg_category_amount:
          yearlyCategories.length > 0
            ? totalYearlyExpense / yearlyCategories.length
            : 0,
        top_category: yearlyCategories[0] || null
      }
    };
  }

  // ==================== 카테고리 관련 엔드포인트 ====================

  @ApiOperation({ summary: '기본 카테고리 목록 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '기본 카테고리 목록 조회 성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('categories/defaults')
  async getDefaultCategories() {
    console.log('=== 기본 카테고리 목록 조회 ===');

    const defaultCategories = {
      income: [
        { id: 'salary', name: '급여', icon: '💰', color: '#4CAF50' },
        { id: 'bonus', name: '보너스', icon: '🎁', color: '#8BC34A' },
        { id: 'side_job', name: '부업', icon: '💼', color: '#CDDC39' },
        { id: 'investment', name: '투자수익', icon: '📈', color: '#009688' },
        { id: 'allowance', name: '용돈', icon: '💝', color: '#FF9800' },
        { id: 'refund', name: '환불', icon: '💳', color: '#607D8B' },
        { id: 'gift', name: '선물', icon: '🎀', color: '#E91E63' },
        { id: 'other_income', name: '기타수입', icon: '➕', color: '#9C27B0' }
      ],
      expense: [
        // 필수 생활비
        { id: 'food', name: '식비', icon: '🍽️', color: '#FF5722' },
        { id: 'housing', name: '주거비', icon: '🏠', color: '#795548' },
        { id: 'transportation', name: '교통비', icon: '🚗', color: '#3F51B5' },
        { id: 'utilities', name: '공과금', icon: '💡', color: '#FFC107' },
        { id: 'communication', name: '통신비', icon: '📱', color: '#00BCD4' },

        // 개인 관리
        { id: 'healthcare', name: '의료비', icon: '🏥', color: '#F44336' },
        { id: 'beauty', name: '미용', icon: '💄', color: '#E91E63' },
        { id: 'clothing', name: '의류', icon: '👕', color: '#9C27B0' },

        // 생활
        { id: 'shopping', name: '쇼핑', icon: '🛍️', color: '#FF9800' },
        { id: 'culture', name: '문화생활', icon: '🎭', color: '#673AB7' },
        { id: 'education', name: '교육비', icon: '📚', color: '#2196F3' },
        { id: 'sports', name: '운동', icon: '⚽', color: '#4CAF50' },

        // 기타
        { id: 'insurance', name: '보험료', icon: '🛡️', color: '#607D8B' },
        { id: 'savings', name: '적금/저축', icon: '🏦', color: '#009688' },
        {
          id: 'gift_expense',
          name: '선물/경조사',
          icon: '💐',
          color: '#CDDC39'
        },
        { id: 'pet', name: '반려동물', icon: '🐕', color: '#8BC34A' },
        { id: 'other_expense', name: '기타지출', icon: '➖', color: '#9E9E9E' }
      ]
    };

    console.log('📋 수입 카테고리:', defaultCategories.income.length, '개');
    console.log('📋 지출 카테고리:', defaultCategories.expense.length, '개');

    return {
      categories: defaultCategories,
      summary: {
        total_income_categories: defaultCategories.income.length,
        total_expense_categories: defaultCategories.expense.length,
        total_categories:
          defaultCategories.income.length + defaultCategories.expense.length
      }
    };
  }

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
    const timestamp = dayjs().tz(KST_TIMEZONE).format();
    const requestId = Math.random().toString(36).substring(7);

    console.log(
      `\n📂 [${timestamp}] [ID:${requestId}] === 사용된 카테고리 조회 ===`
    );
    console.log(`[${requestId}] Workspace ID:`, workspace_id);
    console.log(`[${requestId}] Type filter:`, type || 'all');

    if (!workspace_id) {
      throw new BadRequestException('workspace_id parameter is required');
    }

    // 해당 워크스페이스의 모든 거래 조회
    const transactions = await this.transactionService.findAll(workspace_id);
    console.log(`[${requestId}] 📊 총 거래 수:`, transactions.length);

    // 카테고리별 통계 생성
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
      // type 필터링
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

    // 카테고리 배열로 변환 및 정렬
    const usedCategories = Array.from(categoryStats.values()).sort(
      (a, b) => b.count - a.count
    ); // 사용 빈도순으로 정렬

    // 타입별로 분리
    const incomeCategories = usedCategories
      .filter((cat) => cat.type === 'income')
      .map((cat) => ({
        name: cat.category,
        count: cat.count,
        total_amount: cat.total_amount,
        last_used: cat.last_used,
        last_used_kst: dayjs(cat.last_used).tz(KST_TIMEZONE).format()
      }));

    const expenseCategories = usedCategories
      .filter((cat) => cat.type === 'expense')
      .map((cat) => ({
        name: cat.category,
        count: cat.count,
        total_amount: cat.total_amount,
        last_used: cat.last_used,
        last_used_kst: dayjs(cat.last_used).tz(KST_TIMEZONE).format()
      }));

    console.log(
      `[${requestId}] 📊 사용된 수입 카테고리:`,
      incomeCategories.length,
      '개'
    );
    console.log(
      `[${requestId}] 📊 사용된 지출 카테고리:`,
      expenseCategories.length,
      '개'
    );

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

  @ApiOperation({ summary: '추천 카테고리 조회 (기본 + 사용된 카테고리 통합)' })
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
    const timestamp = dayjs().tz(KST_TIMEZONE).format();
    const requestId = Math.random().toString(36).substring(7);

    console.log(
      `\n💡 [${timestamp}] [ID:${requestId}] === 추천 카테고리 조회 ===`
    );
    console.log(`[${requestId}] Workspace ID:`, workspace_id);
    console.log(`[${requestId}] Type:`, type);

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

    // 기본 카테고리 가져오기
    const defaultCategoriesResponse = await this.getDefaultCategories();
    const defaultCategories = defaultCategoriesResponse.categories[type];

    // 사용된 카테고리 가져오기
    const usedCategoriesResponse = await this.getUsedCategories(
      req,
      workspace_id,
      type
    );
    const usedCategories = usedCategoriesResponse.used_categories[type];

    // 사용된 카테고리 이름 목록
    const usedCategoryNames = new Set(usedCategories.map((cat) => cat.name));

    // 추천 카테고리 생성 (사용된 카테고리를 우선순위로)
    const suggestions = [
      // 1. 사용된 카테고리 (사용 빈도순)
      ...usedCategories.map((cat) => ({
        id: cat.name.toLowerCase().replace(/\s+/g, '_'),
        name: cat.name,
        icon: '📊', // 사용된 카테고리는 통계 아이콘
        color: '#2196F3',
        is_used: true,
        usage_count: cat.count,
        total_amount: cat.total_amount,
        last_used: cat.last_used_kst
      })),

      // 2. 사용되지 않은 기본 카테고리
      ...defaultCategories
        .filter((cat) => !usedCategoryNames.has(cat.name))
        .map((cat) => ({
          ...cat,
          is_used: false,
          usage_count: 0,
          total_amount: 0
        }))
    ];

    console.log(
      `[${requestId}] 💡 ${type} 추천 카테고리:`,
      suggestions.length,
      '개'
    );
    console.log(
      `[${requestId}] - 사용된 카테고리:`,
      usedCategories.length,
      '개'
    );
    console.log(
      `[${requestId}] - 기본 카테고리:`,
      defaultCategories.length - usedCategories.length,
      '개'
    );

    return {
      workspace_id,
      type,
      suggestions,
      summary: {
        total_suggestions: suggestions.length,
        used_categories: usedCategories.length,
        default_categories: defaultCategories.length - usedCategories.length
      }
    };
  }

  // ==================== 디버깅용 엔드포인트 ====================

  @ApiOperation({ summary: '디버깅: 워크스페이스 모든 거래 조회' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '모든 거래 조회 성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('debug/all/:workspace_id')
  async getAllTransactionsDebug(@Param('workspace_id') workspace_id: string) {
    console.log('=== 디버깅: 모든 거래 조회 ===');
    console.log('Workspace:', workspace_id);

    const allTransactions = await this.transactionService.findAll(workspace_id);

    console.log(`📋 총 거래 수: ${allTransactions.length}`);
    allTransactions.forEach((t, index) => {
      console.log(
        `${index + 1}. ${t.title} - ${t.amount}원 (${t.type}) - ${t.date}`
      );
    });

    return {
      total_count: allTransactions.length,
      transactions: allTransactions
    };
  }

  @ApiOperation({ summary: '디버깅: 즉시 통계 재계산' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '통계 재계산 성공'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('debug/recalc/:workspace_id/:year/:month')
  async recalculateStatsDebug(
    @Param('workspace_id') workspace_id: string,
    @Param('year') year: string,
    @Param('month') month: string
  ) {
    console.log('=== 디버깅: 통계 재계산 ===');
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    const stats = await this.transactionService.getMonthlyStats(
      workspace_id,
      yearNum,
      monthNum
    );

    return {
      workspace_id,
      year: yearNum,
      month: monthNum,
      stats
    };
  }

  @ApiOperation({ summary: '디버깅: 요청 파라미터 상세 분석' })
  @ApiOkResponse({
    type: ResponseDto,
    description: '파라미터 분석 결과'
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('debug/params')
  async debugRequestParams(@Req() req: any) {
    console.log('=== 파라미터 디버깅 ===');
    console.log('Full URL:', req.url);
    console.log('Raw Query String:', req.url.split('?')[1]);
    console.log('Parsed Query Params:', req.query);

    Object.keys(req.query).forEach((key) => {
      const value = req.query[key];
      console.log(`- ${key}: "${value}" (타입: ${typeof value})`);
    });

    return {
      full_url: req.url,
      raw_query_string: req.url.split('?')[1],
      parsed_params: req.query,
      param_details: Object.keys(req.query).map((key) => ({
        key,
        value: req.query[key],
        type: typeof req.query[key],
        parsed_number: parseInt(req.query[key], 10),
        is_valid_number: !isNaN(parseInt(req.query[key], 10))
      }))
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
    console.log('=== 거래 생성 ===');
    console.log('User:', user._id);
    console.log('Workspace:', workspace_id);
    console.log('Transaction data:', body);

    if (!workspace_id) {
      throw new BadRequestException('workspace_id parameter is required');
    }

    // 거래 생성
    const result = await this.transactionService.create(
      user,
      workspace_id,
      body
    );

    // 생성 결과 로깅
    console.log('✅ 거래 생성 완료:', {
      id: result._id,
      title: result.title,
      amount: result.amount,
      type: result.type,
      date: result.date,
      workspace: result.workspace
    });

    // 생성 직후 통계 확인을 위한 로깅 (한국 시간 기준)
    const transactionDate = dayjs(result.date).tz(KST_TIMEZONE);
    const year = transactionDate.year();
    const month = transactionDate.month() + 1;

    console.log(
      `📊 통계 영향 예상 - 년: ${year}, 월: ${month}, 워크스페이스: ${workspace_id}`
    );

    // 즉시 해당 월의 통계를 다시 계산해서 로깅
    try {
      const updatedStats = await this.transactionService.getMonthlyStats(
        workspace_id,
        year,
        month
      );
      console.log('📈 업데이트된 월별 통계:', {
        total_income: updatedStats.total_income,
        total_expense: updatedStats.total_expense,
        category_stats_count: updatedStats.category_stats.length
      });
    } catch (error) {
      console.error('❌ 통계 재계산 중 오류:', error);
    }

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
    console.log('=== 거래 수정 ===');
    console.log('Transaction ID:', id);
    console.log('Update data:', body);

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
    console.log('=== 거래 삭제 ===');
    console.log('Transaction ID:', id);

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
    console.log('=== 거래 상세 조회 ===');
    console.log('Transaction ID:', id);

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
    const timestamp = dayjs().tz(KST_TIMEZONE).format();
    const requestId = Math.random().toString(36).substring(7);

    console.log(
      `\n📅 [${timestamp}] [ID:${requestId}] === BUDGET RANGE 엔드포인트 ===`
    );
    console.log(`[${requestId}] Full URL:`, req.url);
    console.log(`[${requestId}] Workspace ID:`, workspace_id);
    console.log(`[${requestId}] 날짜 범위:`, start_date, '~', end_date);

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

      console.log(
        `[${requestId}] 변환된 시작 날짜 (KST):`,
        dayjs(startDate).tz(KST_TIMEZONE).format()
      );
      console.log(
        `[${requestId}] 변환된 종료 날짜 (KST):`,
        dayjs(endDate).tz(KST_TIMEZONE).format()
      );
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
    console.log(`[${requestId}] 🔍 범위별 거래 조회 시작`);
    const transactions = await this.transactionService.findAll(workspace_id, {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    });

    console.log(`[${requestId}] 📋 조회된 거래 수:`, transactions.length);

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

    console.log(`[${requestId}] 💰 총 수입:`, totalIncome);
    console.log(`[${requestId}] 💸 총 지출:`, totalExpense);
    console.log(`[${requestId}] 💵 잔액:`, balance);

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
