import { Module } from '@nestjs/common';
import { SamplesController } from './samples.controller';
import { SamplesService } from './samples.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SamplesController],
  providers: [SamplesService],
})
export class SamplesModule {}
