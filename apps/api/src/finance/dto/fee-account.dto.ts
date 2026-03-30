import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Form, Stream } from '../../users/enums/user-role.enum';
import { FeeAccountStatus } from '../entities/student-fee-account.entity';

export class BulkAssignFeesDto {
  @ApiProperty()
  @IsUUID()
  feeStructureId: string;
}

export class ApplyExemptionDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'Government bursary' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class GetTermAccountsDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  feeStructureId?: string;

  @ApiPropertyOptional({ enum: FeeAccountStatus })
  @IsEnum(FeeAccountStatus)
  @IsOptional()
  status?: FeeAccountStatus;

  @ApiPropertyOptional({ enum: Form })
  @IsEnum(Form)
  @IsOptional()
  form?: Form;

  @ApiPropertyOptional({ enum: Stream })
  @IsEnum(Stream)
  @IsOptional()
  stream?: Stream;
}
