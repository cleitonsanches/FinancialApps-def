import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PhasesService } from './phases.service';
import { Phase } from '../../database/entities/phase.entity';

/**
 * Controller para gerenciar Fases de Projetos
 * 
 * Endpoints:
 * - GET /phases?projectId=xxx - Lista todas as fases de um projeto
 * - GET /phases/:id - Busca uma fase específica
 * - POST /phases - Cria uma nova fase (requer projectId no body)
 * - PUT /phases/:id - Atualiza uma fase
 * - DELETE /phases/:id - Deleta uma fase
 * - POST /phases/reorder - Reordena as fases de um projeto
 */
@Controller('phases')
export class PhasesController {
  constructor(private phasesService: PhasesService) {}

  @Get()
  async findAll(@Query('projectId') projectId: string): Promise<Phase[]> {
    if (!projectId) {
      throw new Error('projectId é obrigatório');
    }
    return this.phasesService.findAll(projectId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Phase> {
    return this.phasesService.findOne(id);
  }

  @Post()
  async create(@Body() phaseData: Partial<Phase> & { projectId: string }): Promise<Phase> {
    if (!phaseData.projectId) {
      throw new Error('projectId é obrigatório');
    }
    return this.phasesService.create(phaseData.projectId, phaseData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() phaseData: Partial<Phase>): Promise<Phase> {
    return this.phasesService.update(id, phaseData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.phasesService.delete(id);
  }

  @Post('reorder')
  async reorder(@Body() data: { projectId: string; phaseOrders: { id: string; ordem: number }[] }): Promise<void> {
    return this.phasesService.reorder(data.projectId, data.phaseOrders);
  }
}

