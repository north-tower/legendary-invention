import { IsOptional, IsString } from 'class-validator';

export class TwilioWebhookDto {
  @IsString()
  From: string;

  @IsString()
  Body: string;

  @IsString()
  @IsOptional()
  To?: string;

  @IsString()
  @IsOptional()
  MessageSid?: string;
}
