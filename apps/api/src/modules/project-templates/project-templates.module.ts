import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTemplate } from '../../database/entities/project-template.entity';
import { ProjectTemplatesService } from './project-templates.service';
import { ProjectTemplatesController } from './project-templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTemplate])],
  controllers: [ProjectTemplatesController],
  providers: [ProjectTemplatesService],
  exports: [ProjectTemplatesService],
})
export class ProjectTemplatesModule {}

