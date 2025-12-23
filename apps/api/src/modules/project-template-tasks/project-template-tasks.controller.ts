import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ProjectTemplateTasksService } from './project-template-tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('project-templates/:templateId/tasks')
@UseGuards(JwtAuthGuard)
export class ProjectTemplateTasksController {
  constructor(private readonly tasksService: ProjectTemplateTasksService) {}

  @Post()
  create(@Param('templateId') templateId: string, @Body() createTaskDto: any, @Request() req: any) {
    return this.tasksService.create(createTaskDto, templateId);
  }

  @Get()
  findAll(@Param('templateId') templateId: string) {
    return this.tasksService.findAllByTemplate(templateId);
  }

  @Get(':id')
  findOne(@Param('templateId') templateId: string, @Param('id') id: string) {
    return this.tasksService.findOne(id, templateId);
  }

  @Patch(':id')
  update(@Param('templateId') templateId: string, @Param('id') id: string, @Body() updateTaskDto: any) {
    return this.tasksService.update(id, updateTaskDto, templateId);
  }

  @Delete(':id')
  remove(@Param('templateId') templateId: string, @Param('id') id: string) {
    return this.tasksService.remove(id, templateId);
  }

  @Post('reorder')
  reorder(@Param('templateId') templateId: string, @Body() body: { tasks: Array<{ id: string; ordem: number }> }) {
    return this.tasksService.updateOrder(body.tasks, templateId);
  }
}

