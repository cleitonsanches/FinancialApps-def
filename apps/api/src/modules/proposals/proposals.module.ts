import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from '../../database/entities/proposal.entity';
import { ProposalTemplate } from '../../database/entities/proposal-template.entity';
import { ProjectTemplate } from '../../database/entities/project-template.entity';
import { ProjectTemplateTask } from '../../database/entities/project-template-task.entity';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { Client } from '../../database/entities/client.entity';
import { User } from '../../database/entities/user.entity';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, ProposalTemplate, ProjectTemplate, ProjectTemplateTask, Project, ProjectTask, Client, User])],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}



