import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Client } from '../../database/entities/client.entity';

@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('isCliente') isCliente?: string,
    @Query('isFornecedor') isFornecedor?: string,
    @Request() req?: any
  ): Promise<Client[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    console.log('ClientsController.findAll - companyId:', companyId, 'req?.user?.companyId:', req?.user?.companyId, 'effectiveCompanyId:', effectiveCompanyId);
    const clients = await this.clientsService.findAll(effectiveCompanyId, isCliente === 'true', isFornecedor === 'true');
    console.log('ClientsController.findAll - encontrados:', clients.length, 'clientes');
    return clients;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Client> {
    return this.clientsService.findOne(id);
  }

  @Post()
  async create(@Body() clientData: Partial<Client>, @Request() req?: any): Promise<Client> {
    const companyId = req?.user?.companyId || clientData.companyId;
    if (companyId && !clientData.companyId) {
      clientData.companyId = companyId;
    }
    return this.clientsService.create(clientData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() clientData: Partial<Client>): Promise<Client> {
    return this.clientsService.update(id, clientData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.clientsService.delete(id);
  }
}

