import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, BadRequestException } from '@nestjs/common';
import { ProposalTemplatesService } from './proposal-templates.service';
import { ProposalTemplate } from '../../database/entities/proposal-template.entity';

@Controller('proposal-templates')
export class ProposalTemplatesController {
  constructor(private proposalTemplatesService: ProposalTemplatesService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<ProposalTemplate[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.proposalTemplatesService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProposalTemplate> {
    return this.proposalTemplatesService.findOne(id);
  }

  @Post()
  async create(@Body() templateData: Partial<ProposalTemplate>, @Request() req?: any): Promise<ProposalTemplate> {
    const companyId = req?.user?.companyId || templateData.companyId;
    
    if (!companyId) {
      throw new BadRequestException('companyId is required. Please provide companyId in the request body or ensure you are authenticated.');
    }
    
    templateData.companyId = companyId;
    return this.proposalTemplatesService.create(templateData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() templateData: Partial<ProposalTemplate>): Promise<ProposalTemplate> {
    return this.proposalTemplatesService.update(id, templateData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.proposalTemplatesService.delete(id);
  }
}

