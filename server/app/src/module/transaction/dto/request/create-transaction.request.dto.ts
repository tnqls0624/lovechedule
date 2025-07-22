import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNotEmpty,
  Min
} from 'class-validator';
import {
  TransactionType,
  PaymentMethod
} from '../../schema/transaction.schema';

export class CreateTransactionRequestDto {
  @ApiProperty({
    example: '스타벅스 커피',
    description: '거래 제목'
  })
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({
    example: 5500,
    description: '금액'
  })
  @IsNumber()
  @Min(0)
  readonly amount: number;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.EXPENSE,
    description: '거래 유형 (수입/지출)'
  })
  @IsEnum(TransactionType)
  readonly type: TransactionType;

  @ApiProperty({
    example: '식비',
    description: '카테고리'
  })
  @IsString()
  @IsNotEmpty()
  readonly category: string;

  @ApiProperty({
    example: '데이트 카페',
    description: '설명',
    required: false
  })
  @IsString()
  @IsOptional()
  readonly description?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: '거래 날짜'
  })
  @IsDateString()
  readonly date: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
    description: '결제 방법',
    required: false
  })
  @IsEnum(PaymentMethod)
  @IsOptional()
  readonly payment_method?: PaymentMethod;

  @ApiProperty({
    example: false,
    description: '반복 거래 여부',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  readonly is_recurring?: boolean;

  @ApiProperty({
    example: 'monthly',
    description: '반복 주기 (monthly, weekly, yearly)',
    required: false
  })
  @IsString()
  @IsOptional()
  readonly recurring_period?: string;
}
