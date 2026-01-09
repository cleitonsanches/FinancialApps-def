import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from '../../database/entities/proposal.entity';
import { ProposalTemplate } from '../../database/entities/proposal-template.entity';
import { ProjectTemplate } from '../../database/entities/project-template.entity';
import { ProjectTemplateTask } from '../../database/entities/project-template-task.entity';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { Phase } from '../../database/entities/phase.entity';
import { Client } from '../../database/entities/client.entity';
import { User } from '../../database/entities/user.entity';
import { ServiceType } from '../../database/entities/service-type.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { InvoiceHistory } from '../../database/entities/invoice-history.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';
import { ProposalPdfService } from './proposal-pdf.service';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, ProposalTemplate, ProjectTemplate, ProjectTemplateTask, Project, ProjectTask, Phase, Client, User, ServiceType, Invoice, InvoiceHistory, TimeEntry])],
  controllers: [ProposalsController],
  providers: [ProposalsService, ProposalPdfService],
  exports: [ProposalsService],
})
export class ProposalsModule {}



