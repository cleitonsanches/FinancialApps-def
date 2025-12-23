import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProposalTemplate } from '../../database/entities/proposal-template.entity';

@Injectable()
export class ProposalTemplatesService {
  constructor(
    @InjectRepository(ProposalTemplate)
    private proposalTemplateRepository: Repository<ProposalTemplate>,
  ) {}

  async findAll(companyId?: string): Promise<ProposalTemplate[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.proposalTemplateRepository.find({ 
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProposalTemplate> {
    return this.proposalTemplateRepository.findOne({ 
      where: { id },
    });
  }

  async create(templateData: Partial<ProposalTemplate>): Promise<ProposalTemplate> {
    const template = this.proposalTemplateRepository.create(templateData);
    return this.proposalTemplateRepository.save(template);
  }

  async update(id: string, templateData: Partial<ProposalTemplate>): Promise<ProposalTemplate> {
    await this.proposalTemplateRepository.update(id, templateData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.proposalTemplateRepository.delete(id);
  }
}

