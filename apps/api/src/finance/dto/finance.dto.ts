import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Form } from '../../users/enums/user-role.enum';
import { Term, PaymentMethod } from '../enums/finance.enum';

export class CreateFeeStructureDto {
  @ApiProperty({ enum: Form })
  @IsEnum(Form)
  form: Form;

  @ApiProperty({ example: '2025' })
  @IsString()
  @IsNotEmpty()
  academic_year: string;

  @ApiProperty({ enum: Term })
  @IsEnum(Term)
  term: Term;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @IsPositive()
  total_amount: number;
}

export class RecordPaymentDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty()
  @IsUUID()
  feeStructureId: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  mpesa_receipt?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  mpesa_phone?: string;

  @ApiProperty({ example: '2026-03-23T10:00:00Z' })
  @IsDateString()
  transaction_date: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
