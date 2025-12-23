import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalTemplateField } from '../../database/entities/proposal-template-field.entity';
import { ProposalTemplateFieldsService } from './proposal-template-fields.service';
import { ProposalTemplateFieldsController } from './proposal-template-fields.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProposalTemplateField])],
  controllers: [ProposalTemplateFieldsController],
  providers: [ProposalTemplateFieldsService],
  exports: [ProposalTemplateFieldsService],
})
export class ProposalTemplateFieldsModule {}

