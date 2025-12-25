import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalAditivo } from '../../database/entities/proposal-aditivo.entity';
import { Proposal } from '../../database/entities/proposal.entity';
import { ProposalAditivosService } from './proposal-aditivos.service';
import { ProposalAditivosController } from './proposal-aditivos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProposalAditivo, Proposal])],
  controllers: [ProposalAditivosController],
  providers: [ProposalAditivosService],
  exports: [ProposalAditivosService],
})
export class ProposalAditivosModule {}

