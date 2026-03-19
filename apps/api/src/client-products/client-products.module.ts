import { Module } from '@nestjs/common';
import { ClientProductsController } from './client-products.controller';
import { ClientProductsService } from './client-products.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClientProductsController],
  providers: [ClientProductsService],
  exports: [ClientProductsService],
})
export class ClientProductsModule {}
