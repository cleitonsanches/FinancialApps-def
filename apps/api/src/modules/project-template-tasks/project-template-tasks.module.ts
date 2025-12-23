import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTemplateTask } from '../../database/entities/project-template-task.entity';
import { ProjectTemplate } from '../../database/entities/project-template.entity';
import { ProjectTemplateTasksService } from './project-template-tasks.service';
import { ProjectTemplateTasksController } from './project-template-tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTemplateTask, ProjectTemplate])],
  controllers: [ProjectTemplateTasksController],
  providers: [ProjectTemplateTasksService],
  exports: [ProjectTemplateTasksService],
})
export class ProjectTemplateTasksModule {}

