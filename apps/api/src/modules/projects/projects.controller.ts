import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from '../../database/entities/project.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<Project[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.projectsService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Post()
  async create(@Body() projectData: Partial<Project>, @Request() req?: any): Promise<Project> {
    const companyId = req?.user?.companyId;
    if (companyId && !projectData.companyId) {
      projectData.companyId = companyId;
    }
    return this.projectsService.create(projectData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() projectData: Partial<Project>): Promise<Project> {
    return this.projectsService.update(id, projectData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.projectsService.delete(id);
  }

  @Get('tasks/all')
  async findAllTasks(@Query('projectId') projectId?: string): Promise<any[]> {
    return this.projectsService.findAllTasks(projectId);
  }

  @Get(':id/tasks')
  async findProjectTasks(@Param('id') projectId: string): Promise<any[]> {
    return this.projectsService.findAllTasks(projectId);
  }

  @Post(':id/tasks')
  async createTask(@Param('id') projectId: string, @Body() taskData: any): Promise<any> {
    return this.projectsService.createTask(projectId, taskData);
  }
}

