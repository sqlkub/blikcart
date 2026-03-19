import { Module } from '@nestjs/common';
import { ManufacturersController } from './manufacturers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ManufacturersController],
})
export class ManufacturersModule {}
