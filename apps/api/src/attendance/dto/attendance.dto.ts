import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '../enums/attendance-status.enum';
import { Form, Stream } from '../../users/enums/user-role.enum';

export class MarkAttendanceDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: '2026-03-23' })
  @IsDateString()
  date: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class AttendanceEntryDto {
  @ApiProperty()
  @IsUUID()
  studentId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkMarkAttendanceDto {
  @ApiProperty({ enum: Form })
  @IsEnum(Form)
  form: Form;

  @ApiProperty({ enum: Stream })
  @IsEnum(Stream)
  stream: Stream;

  @ApiProperty({ example: '2026-03-23' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [AttendanceEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries: AttendanceEntryDto[];
}
