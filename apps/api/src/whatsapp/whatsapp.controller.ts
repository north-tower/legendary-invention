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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
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
    @Body() body: Record<string, any>,
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
  ): Promise<string> {
    const from = String(body?.From || '');
    const message = String(body?.Body || '');
    const messageSid = String(body?.MessageSid || 'n/a');

    this.logger.log(
      `Incoming webhook From=${from || 'unknown'} MessageSid=${messageSid}`,
    );
    const configuredUrl = `${this.config.get<string>('app.baseUrl')}/api/v1/whatsapp/webhook`;
    const forwardedProto = (req.headers['x-forwarded-proto'] as string) || 'https';
    const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
    const proxiedUrl = `${forwardedProto}://${forwardedHost}${req.originalUrl}`;
    const directUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const urlsToTry = [configuredUrl, proxiedUrl, directUrl];

    const isValidSignature = urlsToTry.some((candidate) =>
      this.twilioService.validateSignature(
        signature,
        candidate,
        (req.body || {}) as Record<string, string>,
      ),
    );
    this.logger.log(
      `Signature check: ${isValidSignature ? 'valid' : 'invalid'} configuredUrl=${configuredUrl} proxiedUrl=${proxiedUrl} directUrl=${directUrl}`,
    );
    if (!isValidSignature) {
      this.logger.warn(
        `Rejected webhook due to invalid signature From=${body?.From || 'unknown'}`,
      );
      throw new ForbiddenException('Invalid Twilio signature');
    }

    if (!from || !message) {
      this.logger.warn(`Webhook missing required fields From/Body MessageSid=${messageSid}`);
      return '<Response></Response>';
    }

    this.botService.handleIncoming(from, message).catch((err) => {
      this.logger.error(
        `Async bot error From=${from || 'unknown'} MessageSid=${messageSid}`,
        err?.stack || err,
      );
      this.twilioService
        .sendMessage(
          from,
          'Sorry, something went wrong. Please try again in a moment.',
        )
        .catch(() => undefined);
    });
    this.logger.log(
      `Webhook accepted and bot dispatched From=${from || 'unknown'} MessageSid=${messageSid}`,
    );

    return '<Response></Response>';
  }

  @Get('health')
  @SkipThrottle()
  health(): string {
    return 'WhatsApp bot online';
  }
}
