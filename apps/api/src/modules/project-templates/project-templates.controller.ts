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
}

