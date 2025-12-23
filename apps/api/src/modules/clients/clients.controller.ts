import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  create(@Body() createClientDto: any, @Request() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Usuário não possui empresa vinculada. Por favor, cadastre uma empresa primeiro.');
    }
    return this.clientsService.create(createClientDto, companyId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.clientsService.findAll(req.user?.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.clientsService.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: any, @Request() req: any) {
    return this.clientsService.update(id, updateClientDto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.clientsService.remove(id, req.user?.companyId);
  }
}

