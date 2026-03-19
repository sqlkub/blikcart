import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('manufacturers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('manufacturers')
export class ManufacturersController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.manufacturer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  @Post()
  create(@Body() body: any) {
    return this.prisma.manufacturer.create({ data: {
      name: body.name, country: body.country, contactName: body.contactName,
      contactEmail: body.contactEmail, leadTimeDays: body.leadTimeDays || 21,
      notes: body.notes,
    }});
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const allowed = ['name', 'country', 'contactName', 'contactEmail', 'leadTimeDays', 'notes', 'isActive'];
    const data: any = {};
    for (const k of allowed) { if (body[k] !== undefined) data[k] = body[k]; }
    return this.prisma.manufacturer.update({ where: { id }, data });
  }
}
