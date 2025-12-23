import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { Proposal } from '../../database/entities/proposal.entity';

@Controller(['proposals', 'negotiations'])
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<Proposal[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.proposalsService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Proposal> {
    return this.proposalsService.findOne(id);
  }

  @Post()
  async create(@Body() proposalData: Partial<Proposal>, @Request() req?: any): Promise<Proposal> {
    const companyId = req?.user?.companyId;
    if (companyId && !proposalData.companyId) {
      proposalData.companyId = companyId;
    }
    return this.proposalsService.create(proposalData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() proposalData: Partial<Proposal>): Promise<Proposal> {
    return this.proposalsService.update(id, proposalData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.proposalsService.delete(id);
  }

  @Post(':id/create-project-from-template')
  async createProjectFromTemplate(
    @Param('id') proposalId: string,
    @Body() body: { templateId: string; startDate: string },
  ): Promise<any> {
    const startDate = new Date(body.startDate);
    return this.proposalsService.createProjectFromTemplate(proposalId, body.templateId, startDate);
  }
}

