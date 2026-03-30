import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  ValidationPipe,
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
  private readonly logger = new Logger(WhatsAppController.name);

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
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      }),
    )
    body: TwilioWebhookDto,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
  ): Promise<string> {
    this.logger.log(
      `Incoming webhook From=${body?.From || 'unknown'} MessageSid=${body?.MessageSid || 'n/a'}`,
    );
    const url = `${this.config.get<string>('app.baseUrl')}/api/v1/whatsapp/webhook`;
    const isValidSignature = this.twilioService.validateSignature(
      signature,
      url,
      (req.body || {}) as Record<string, string>,
    );
    this.logger.log(
      `Signature check: ${isValidSignature ? 'valid' : 'invalid'} baseUrl=${url}`,
    );
    if (!isValidSignature) {
      this.logger.warn(
        `Rejected webhook due to invalid signature From=${body?.From || 'unknown'}`,
      );
      throw new ForbiddenException('Invalid Twilio signature');
    }

    this.botService.handleIncoming(body.From, body.Body).catch((err) => {
      this.logger.error(
        `Async bot error From=${body?.From || 'unknown'} MessageSid=${body?.MessageSid || 'n/a'}`,
        err?.stack || err,
      );
      this.twilioService
        .sendMessage(
          body.From,
          'Sorry, something went wrong. Please try again in a moment.',
        )
        .catch(() => undefined);
    });
    this.logger.log(
      `Webhook accepted and bot dispatched From=${body?.From || 'unknown'} MessageSid=${body?.MessageSid || 'n/a'}`,
    );

    return '<Response></Response>';
  }

  @Get('health')
  @SkipThrottle()
  health(): string {
    return 'WhatsApp bot online';
  }
}
