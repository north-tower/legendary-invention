import { IsString, IsArray, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMedicalCardDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  blood_type?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronic_conditions?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  current_medications?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  emergency_contact_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  emergency_contact_phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  emergency_contact_relation?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  medical_notes?: string;
}
