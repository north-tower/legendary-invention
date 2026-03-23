import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, Form, Stream, Gender } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@sychar.ac.ke' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: '+254700000000', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ enum: Gender, required: false })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ enum: Form, required: false })
  @IsEnum(Form)
  @IsOptional()
  assigned_form?: Form;

  @ApiProperty({ enum: Stream, required: false })
  @IsEnum(Stream)
  @IsOptional()
  assigned_stream?: Stream;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  department?: string;
}
