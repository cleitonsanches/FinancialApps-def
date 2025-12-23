import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { ProposalTemplatesService } from './proposal-templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('proposal-templates')
@UseGuards(JwtAuthGuard)
export class ProposalTemplatesController {
  constructor(private readonly templatesService: ProposalTemplatesService) {}

  @Post()
  create(@Body() createTemplateDto: any, @Request() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Usuário não possui empresa vinculada. Por favor, cadastre uma empresa primeiro.');
    }
    return this.templatesService.create(createTemplateDto, companyId);
  }

  @Get()
  findAll(@Request() req: any, @Query('tipoServico') tipoServico?: string) {
    return this.templatesService.findAll(req.user?.companyId, tipoServico);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.templatesService.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTemplateDto: any, @Request() req: any) {
    return this.templatesService.update(id, updateTemplateDto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.templatesService.remove(id, req.user?.companyId);
  }
}

