import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Form, Stream, Gender } from '../../users/enums/user-role.enum';

export class CreateStudentDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: '2026/0001' })
  @IsString()
  @IsNotEmpty()
  admission_number: string;

  @ApiProperty({ enum: Form })
  @IsEnum(Form)
  form: Form;

  @ApiProperty({ enum: Stream })
  @IsEnum(Stream)
  stream: Stream;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  date_of_birth?: string;

  @ApiProperty({ required: false, description: 'Parent user ID' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ required: false, description: 'Parent full name (used when parent is auto-created)' })
  @IsString()
  @IsOptional()
  parent_name?: string;

  @ApiProperty({ required: false, description: 'Parent phone in +2547 format (used to find/create parent)' })
  @IsString()
  @IsOptional()
  parent_phone?: string;

  @ApiProperty({ example: 'A+', required: false })
  @IsString()
  @IsOptional()
  blood_type?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiProperty({ example: '+254700000000', required: false })
  @IsString()
  @IsOptional()
  emergency_contact?: string;
}
