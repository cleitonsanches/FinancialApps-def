import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Request } from '@nestjs/common';
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
    const companyId = req?.user?.companyId || projectData.companyId;
    if (!companyId) {
      throw new Error('companyId é obrigatório');
    }
    projectData.companyId = companyId;
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

  @Post('tasks')
  async createTaskStandalone(@Body() taskData: any): Promise<any> {
    // Validar que pelo menos um vínculo existe
    if (!taskData.projectId && !taskData.proposalId && !taskData.clientId) {
      throw new Error('É necessário vincular a um Projeto, Negociação ou Cliente');
    }
    return this.projectsService.createTaskStandalone(taskData);
  }

  @Post(':id/tasks')
  async createTask(@Param('id') projectId: string, @Body() taskData: any): Promise<any> {
    return this.projectsService.createTask(projectId, taskData);
  }

  @Put(':id/tasks/:taskId')
  async updateTask(@Param('id') projectId: string, @Param('taskId') taskId: string, @Body() taskData: any): Promise<any> {
    return this.projectsService.updateTask(projectId, taskId, taskData);
  }

  @Get('time-entries')
  async findAllTimeEntries(@Query('projectId') projectId?: string, @Query('proposalId') proposalId?: string, @Query('clientId') clientId?: string): Promise<any[]> {
    return this.projectsService.findTimeEntries(projectId, proposalId, clientId);
  }

  @Get(':id/time-entries')
  async findTimeEntries(@Param('id') projectId: string): Promise<any[]> {
    return this.projectsService.findTimeEntries(projectId);
  }

  @Post('time-entries')
  async createTimeEntry(@Body() timeEntryData: any): Promise<any> {
    return this.projectsService.createTimeEntry(timeEntryData);
  }

  @Post(':id/time-entries')
  async createTimeEntryForProject(@Param('id') projectId: string, @Body() timeEntryData: any): Promise<any> {
    return this.projectsService.createTimeEntry({ ...timeEntryData, projectId });
  }

  @Patch('time-entries/:entryId')
  async updateTimeEntry(@Param('entryId') entryId: string, @Body() timeEntryData: any): Promise<any> {
    return this.projectsService.updateTimeEntry(entryId, timeEntryData);
  }

  @Patch(':id/time-entries/:entryId')
  async updateTimeEntryForProject(@Param('id') projectId: string, @Param('entryId') entryId: string, @Body() timeEntryData: any): Promise<any> {
    return this.projectsService.updateTimeEntry(entryId, { ...timeEntryData, projectId });
  }

  @Patch('tasks/:taskId')
  async patchTask(@Param('taskId') taskId: string, @Body() taskData: any): Promise<any> {
    // Buscar o projeto da tarefa
    const task = await this.projectsService.findTaskById(taskId);
    if (!task) {
      throw new Error('Tarefa não encontrada');
    }
    // Passar projectId mesmo se for null/undefined
    return this.projectsService.updateTask(task.projectId || null, taskId, taskData);
  }
}

