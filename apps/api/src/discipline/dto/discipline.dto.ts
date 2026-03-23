import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IncidentType, Severity, IncidentStatus } from '../enums/discipline.enum';

export class ReportIncidentDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: IncidentType })
  @IsEnum(IncidentType)
  incident_type: IncidentType;

  @ApiProperty({ enum: Severity })
  @IsEnum(Severity)
  severity: Severity;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: '2026-03-23' })
  @IsDateString()
  incident_date: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  action_taken?: string;
}

export class UpdateIncidentDto {
  @ApiProperty({ enum: IncidentStatus, required: false })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  action_taken?: string;

  @ApiProperty({ enum: Severity, required: false })
  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;
}
