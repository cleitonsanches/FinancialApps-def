import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalTemplate } from '../../database/entities/proposal-template.entity';
import { ProposalTemplatesService } from './proposal-templates.service';
import { ProposalTemplatesController } from './proposal-templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProposalTemplate])],
  controllers: [ProposalTemplatesController],
  providers: [ProposalTemplatesService],
  exports: [ProposalTemplatesService],
})
export class ProposalTemplatesModule {}

