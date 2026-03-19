import { Module } from '@nestjs/common';
import { ProformaController } from './proforma.controller';
import { ProformaService } from './proforma.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProformaController],
  providers: [ProformaService],
  exports: [ProformaService],
})
export class ProformaModule {}
