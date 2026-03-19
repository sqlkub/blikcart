import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ConfiguratorModule } from './configurator/configurator.module';
import { OrdersModule } from './orders/orders.module';
import { QuotesModule } from './quotes/quotes.module';
import { PaymentsModule } from './payments/payments.module';
import { ContentModule } from './content/content.module';
import { SamplesModule } from './samples/samples.module';
import { ClientProductsModule } from './client-products/client-products.module';
import { ProformaModule } from './proforma/proforma.module';
import { ManufacturersModule } from './manufacturers/manufacturers.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.local' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    ProductsModule,
    ConfiguratorModule,
    OrdersModule,
    QuotesModule,
    PaymentsModule,
    ContentModule,
    SamplesModule,
    ClientProductsModule,
    ProformaModule,
    ManufacturersModule,
  ],
})
export class AppModule {}
