import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessagePriority } from '../enums/comms.enum';

export class SendMessageDto {
  @ApiProperty({ example: 'Inquiry about term 2 fees' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Hello, I would like to know...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ enum: MessagePriority, required: false })
  @IsEnum(MessagePriority)
  @IsOptional()
  priority?: MessagePriority;
}
