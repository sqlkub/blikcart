import { Controller, Post, Body, Param, UseGuards, Request, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('create/:orderId')
  createPayment(@Param('orderId') orderId: string, @Body() body: any) {
    return this.payments.createMolliePayment(orderId, body.method);
  }

  @Post('webhook')
  webhook(@Body() body: any, @Headers('signature') sig: string) {
    return this.payments.handleWebhook(body, sig);
  }
}
