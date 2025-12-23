import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProposalTemplate } from '../../database/entities/proposal-template.entity';

@Injectable()
export class ProposalTemplatesService {
  constructor(
    @InjectRepository(ProposalTemplate)
    private templateRepository: Repository<ProposalTemplate>,
  ) {}

  async create(createTemplateDto: any, companyId: string) {
    const template = this.templateRepository.create({
      ...createTemplateDto,
      companyId,
    });
    return await this.templateRepository.save(template);
  }

  async findAll(companyId: string, tipoServico?: string) {
    const where: any = { companyId };
    if (tipoServico) {
      where.tipoServico = tipoServico;
    }
    
    return await this.templateRepository.find({
      where,
      order: { nome: 'ASC' },
    });
  }

  async findOne(id: string, companyId: string) {
    const template = await this.templateRepository.findOne({
      where: { id, companyId },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    return template;
  }

  async update(id: string, updateTemplateDto: any, companyId: string) {
    await this.templateRepository.update({ id, companyId }, updateTemplateDto);
    return await this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string) {
    await this.templateRepository.delete({ id, companyId });
  }
}

