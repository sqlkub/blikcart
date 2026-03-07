import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async createMolliePayment(orderId: string, method?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // In production: use Mollie SDK to create payment
    // const mollie = createMollieClient({ apiKey: this.config.get('MOLLIE_API_KEY') });
    // const payment = await mollie.payments.create({...});

    const mockPaymentId = `tr_${Date.now()}`;

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        provider: 'mollie',
        providerPaymentId: mockPaymentId,
        amount: order.total,
        method: method || 'ideal',
        status: 'pending',
      },
    });

    return {
      paymentId: payment.id,
      checkoutUrl: `${this.config.get('PAYMENT_REDIRECT_URL')}?orderId=${orderId}&paymentId=${mockPaymentId}`,
      provider: 'mollie',
    };
  }

  async handleWebhook(body: any, signature: string) {
    // Verify webhook signature from Mollie
    // Update payment and order status
    const { id: providerPaymentId, status } = body;

    const payment = await this.prisma.payment.findUnique({ where: { providerPaymentId } });
    if (!payment) return;

    const mappedStatus = status === 'paid' ? 'paid' : status === 'failed' ? 'failed' : 'pending';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: mappedStatus, paidAt: status === 'paid' ? new Date() : null },
    });

    if (status === 'paid') {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'confirmed' },
      });
    }
  }
}
