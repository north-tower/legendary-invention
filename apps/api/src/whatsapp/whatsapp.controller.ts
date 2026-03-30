import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { TwilioWebhookDto } from './dto/twilio-webhook.dto';
import { WhatsAppBotService } from './whatsapp-bot.service';
import { TwilioService } from './twilio.service';

@ApiTags('WhatsApp')
@Controller('whatsapp')
export class WhatsAppController {
  constructor(
    private readonly botService: WhatsAppBotService,
    private readonly twilioService: TwilioService,
    private readonly config: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  @Header('Content-Type', 'application/xml')
  @SkipThrottle()
  async handleWebhook(
    @Body() body: TwilioWebhookDto,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
  ): Promise<string> {
    const url = `${this.config.get<string>('app.baseUrl')}/api/v1/whatsapp/webhook`;
    if (
      !this.twilioService.validateSignature(
        signature,
        url,
        (req.body || {}) as Record<string, string>,
      )
    ) {
      throw new ForbiddenException('Invalid Twilio signature');
    }

    this.botService.handleIncoming(body.From, body.Body).catch((err) => {
      console.error('WhatsApp bot error:', err);
      this.twilioService
        .sendMessage(
          body.From,
          'Sorry, something went wrong. Please try again in a moment.',
        )
        .catch(() => undefined);
    });

    return '<Response></Response>';
  }

  @Get('health')
  @SkipThrottle()
  health(): string {
    return 'WhatsApp bot online';
  }
}
