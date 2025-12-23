import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ProposalTemplateFieldsService } from './proposal-template-fields.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('proposal-templates/:templateId/fields')
@UseGuards(JwtAuthGuard)
export class ProposalTemplateFieldsController {
  constructor(private readonly fieldsService: ProposalTemplateFieldsService) {}

  @Post()
  create(@Param('templateId') templateId: string, @Body() createFieldDto: any, @Request() req: any) {
    return this.fieldsService.create(createFieldDto, templateId);
  }

  @Get()
  findAll(@Param('templateId') templateId: string) {
    return this.fieldsService.findAllByTemplate(templateId);
  }

  @Get(':id')
  findOne(@Param('templateId') templateId: string, @Param('id') id: string) {
    return this.fieldsService.findOne(id, templateId);
  }

  @Patch(':id')
  update(@Param('templateId') templateId: string, @Param('id') id: string, @Body() updateFieldDto: any) {
    return this.fieldsService.update(id, updateFieldDto, templateId);
  }

  @Delete(':id')
  remove(@Param('templateId') templateId: string, @Param('id') id: string) {
    return this.fieldsService.remove(id, templateId);
  }

  @Post('reorder')
  reorder(@Param('templateId') templateId: string, @Body() body: { fields: Array<{ id: string; ordem: number }> }) {
    return this.fieldsService.updateOrder(body.fields, templateId);
  }
}

