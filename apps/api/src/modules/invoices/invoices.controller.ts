import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, BadRequestException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { Invoice } from '../../database/entities/invoice.entity';

@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<Invoice[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.invoicesService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Invoice> {
    return this.invoicesService.findOne(id);
  }

  @Post()
  async create(@Body() invoiceData: Partial<Invoice>, @Request() req?: any): Promise<Invoice> {
    const companyId = req?.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Usuário não possui empresa vinculada');
    }
    return this.invoicesService.create({ ...invoiceData, companyId });
  }

  @Post('from-proposal-parcels/:proposalId')
  async createFromProposalParcels(@Param('proposalId') proposalId: string, @Body() body: { parcels: any[] }, @Request() req: any) {
    let companyId = req.user?.companyId;
    
    // Se não tiver companyId no req.user, buscar da proposta
    if (!companyId) {
      const proposal = await this.invoicesService.getProposalCompanyId(proposalId);
      if (proposal) {
        companyId = proposal.companyId;
      }
    }
    
    if (!companyId) {
      throw new BadRequestException('Usuário não possui empresa vinculada e não foi possível obter da proposta');
    }
    
    return this.invoicesService.createFromProposalParcels(proposalId, body.parcels, companyId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() invoiceData: Partial<Invoice>): Promise<Invoice> {
    return this.invoicesService.update(id, invoiceData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.invoicesService.delete(id);
  }
}

