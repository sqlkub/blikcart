import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsEmail, IsOptional, IsString } from 'class-validator';

class SendQuoteDto {
  @IsEmail()
  to: string;

  @IsOptional() @IsEmail()
  cc?: string;

  @IsString()
  subject: string;

  @IsString()
  bodyText: string;

  @IsString()
  bodyHtml: string;

  @IsOptional() @IsEmail()
  replyTo?: string;
}

@Controller('mail')
@UseGuards(JwtAuthGuard)
export class MailController {
  constructor(private mail: MailService) {}

  @Post('send-quote')
  async sendQuote(@Body() dto: SendQuoteDto) {
    return this.mail.sendQuote(dto);
  }
}
