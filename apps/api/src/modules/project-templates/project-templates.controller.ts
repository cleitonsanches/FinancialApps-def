import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, BadRequestException } from '@nestjs/common';
import { ProjectTemplatesService } from './project-templates.service';
import { ProjectTemplate } from '../../database/entities/project-template.entity';

@Controller('project-templates')
export class ProjectTemplatesController {
  constructor(private projectTemplatesService: ProjectTemplatesService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<ProjectTemplate[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.projectTemplatesService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProjectTemplate> {
    return this.projectTemplatesService.findOne(id);
  }

  @Post()
  async create(@Body() templateData: Partial<ProjectTemplate>, @Request() req?: any): Promise<ProjectTemplate> {
    const companyId = req?.user?.companyId || templateData.companyId;
    
    if (!companyId) {
      throw new BadRequestException('companyId is required. Please provide companyId in the request body or ensure you are authenticated.');
    }
    
    templateData.companyId = companyId;
    return this.projectTemplatesService.create(templateData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() templateData: Partial<ProjectTemplate>): Promise<ProjectTemplate> {
    return this.projectTemplatesService.update(id, templateData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.projectTemplatesService.delete(id);
  }

  @Post(':id/tasks')
  async createTask(@Param('id') templateId: string, @Body() taskData: any): Promise<any> {
    taskData.templateId = templateId;
    return this.projectTemplatesService.createTask(taskData);
  }

  @Put('tasks/:taskId')
  async updateTask(@Param('taskId') taskId: string, @Body() taskData: any): Promise<any> {
    return this.projectTemplatesService.updateTask(taskId, taskData);
  }

  @Delete('tasks/:taskId')
  async deleteTask(@Param('taskId') taskId: string): Promise<void> {
    return this.projectTemplatesService.deleteTask(taskId);
  }

  // Endpoints para Fases
  @Get(':id/phases')
  async findAllPhases(@Param('id') templateId: string): Promise<any[]> {
    return this.projectTemplatesService.findAllPhases(templateId);
  }

  @Post(':id/phases')
  async createPhase(@Param('id') templateId: string, @Body() phaseData: any): Promise<any> {
    phaseData.templateId = templateId;
    return this.projectTemplatesService.createPhase(phaseData);
  }

  @Get('phases/:phaseId')
  async findOnePhase(@Param('phaseId') phaseId: string): Promise<any> {
    return this.projectTemplatesService.findOnePhase(phaseId);
  }

  @Put('phases/:phaseId')
  async updatePhase(@Param('phaseId') phaseId: string, @Body() phaseData: any): Promise<any> {
    return this.projectTemplatesService.updatePhase(phaseId, phaseData);
  }

  @Delete('phases/:phaseId')
  async deletePhase(@Param('phaseId') phaseId: string): Promise<void> {
    return this.projectTemplatesService.deletePhase(phaseId);
  }

  @Post('phases/reorder')
  async reorderPhases(@Body() data: { templateId: string; phaseOrders: { id: string; ordem: number }[] }): Promise<void> {
    return this.projectTemplatesService.reorderPhases(data.templateId, data.phaseOrders);
  }
}

