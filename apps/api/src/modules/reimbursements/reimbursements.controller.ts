import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ReimbursementsService } from './reimbursements.service';
import { Reimbursement } from '../../database/entities/reimbursement.entity';

@Controller('reimbursements')
export class ReimbursementsController {
  constructor(private reimbursementsService: ReimbursementsService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<Reimbursement[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.reimbursementsService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Reimbursement> {
    return this.reimbursementsService.findOne(id);
  }

  @Post()
  async create(@Body() reimbursementData: Partial<Reimbursement>, @Request() req?: any): Promise<Reimbursement> {
    const companyId = req?.user?.companyId || reimbursementData.companyId;
    if (companyId && !reimbursementData.companyId) {
      reimbursementData.companyId = companyId;
    }
    return this.reimbursementsService.create(reimbursementData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() reimbursementData: Partial<Reimbursement>): Promise<Reimbursement> {
    return this.reimbursementsService.update(id, reimbursementData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.reimbursementsService.delete(id);
  }
}

