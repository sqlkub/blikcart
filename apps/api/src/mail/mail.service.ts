import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface QuoteEmailPayload {
  to: string;
  cc?: string;
  subject: string;
  bodyText: string;       // plain-text fallback
  bodyHtml: string;       // rich HTML
  replyTo?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    if (host && user) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.config.get<string>('SMTP_PORT') || '587'),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user,
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
    } else {
      this.logger.warn('SMTP not configured — emails will be logged only');
    }
  }

  async sendQuote(payload: QuoteEmailPayload) {
    const from = this.config.get<string>('SMTP_FROM') || 'info@blikcart.nl';
    if (!this.transporter) {
      this.logger.log(`[MAIL PREVIEW] To: ${payload.to} | Subject: ${payload.subject}`);
      return { preview: true, message: 'SMTP not configured — logged only' };
    }
    await this.transporter.sendMail({
      from: `"Blikcart" <${from}>`,
      to: payload.to,
      cc: payload.cc || undefined,
      replyTo: payload.replyTo || from,
      subject: payload.subject,
      text: payload.bodyText,
      html: payload.bodyHtml,
    });
    return { sent: true };
  }
}
