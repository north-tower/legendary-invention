import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio, validateRequest } from 'twilio';

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly client: Twilio;

  constructor(private readonly config: ConfigService) {
    this.client = new Twilio(
      this.config.get<string>('app.twilio.accountSid'),
      this.config.get<string>('app.twilio.authToken'),
    );
  }

  async sendMessage(to: string, body: string): Promise<void> {
    try {
      await this.client.messages.create({
        from: this.config.get<string>('app.twilio.whatsappNumber'),
        to,
        body: body.slice(0, 1600),
      });
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message', error);
    }
  }

  validateSignature(signature: string, url: string, params: Record<string, string>): boolean {
    const authToken = this.config.get<string>('app.twilio.authToken') || '';
    if (!signature || !authToken) return false;
    return validateRequest(authToken, signature, url, params);
  }
}
