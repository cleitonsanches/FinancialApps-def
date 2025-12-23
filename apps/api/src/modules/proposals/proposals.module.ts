import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from '../../database/entities/proposal.entity';
import { ProposalTemplate } from '../../database/entities/proposal-template.entity';
import { Client } from '../../database/entities/client.entity';
import { User } from '../../database/entities/user.entity';
import { ProposalsService } from './proposals.service';
import { ProposalsController } from './proposals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal, ProposalTemplate, Client, User])],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}

