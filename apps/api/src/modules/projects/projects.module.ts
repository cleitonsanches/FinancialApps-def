import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { Proposal } from '../../database/entities/proposal.entity';
import { Client } from '../../database/entities/client.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { ChartOfAccounts } from '../../database/entities/chart-of-accounts.entity';
import { TaskComment } from '../../database/entities/task-comment.entity';
import { User } from '../../database/entities/user.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectTask, TimeEntry, Proposal, Client, Invoice, ChartOfAccounts, TaskComment, User])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}



