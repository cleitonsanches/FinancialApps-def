import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTemplate } from '../../database/entities/project-template.entity';
import { ProjectTemplateTask } from '../../database/entities/project-template-task.entity';
import { ProjectTemplatePhase } from '../../database/entities/project-template-phase.entity';
import { ProjectTemplatesService } from './project-templates.service';
import { ProjectTemplatesController } from './project-templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTemplate, ProjectTemplateTask, ProjectTemplatePhase])],
  controllers: [ProjectTemplatesController],
  providers: [ProjectTemplatesService],
  exports: [ProjectTemplatesService],
})
export class ProjectTemplatesModule {}



