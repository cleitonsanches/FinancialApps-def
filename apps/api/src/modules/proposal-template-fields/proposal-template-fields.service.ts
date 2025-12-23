import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProposalTemplateField } from '../../database/entities/proposal-template-field.entity';

@Injectable()
export class ProposalTemplateFieldsService {
  constructor(
    @InjectRepository(ProposalTemplateField)
    private fieldRepository: Repository<ProposalTemplateField>,
  ) {}

  async create(createFieldDto: any, templateId: string) {
    const field = this.fieldRepository.create({
      ...createFieldDto,
      templateId,
    });
    return await this.fieldRepository.save(field);
  }

  async findAllByTemplate(templateId: string) {
    return await this.fieldRepository.find({
      where: { templateId },
      order: { ordem: 'ASC', nome: 'ASC' },
    });
  }

  async findOne(id: string, templateId: string) {
    const field = await this.fieldRepository.findOne({
      where: { id, templateId },
    });

    if (!field) {
      throw new NotFoundException('Campo não encontrado');
    }

    return field;
  }

  async update(id: string, updateFieldDto: any, templateId: string) {
    await this.fieldRepository.update({ id, templateId }, updateFieldDto);
    return await this.findOne(id, templateId);
  }

  async remove(id: string, templateId: string) {
    await this.fieldRepository.delete({ id, templateId });
  }

  async updateOrder(fields: Array<{ id: string; ordem: number }>, templateId: string) {
    for (const field of fields) {
      await this.fieldRepository.update(
        { id: field.id, templateId },
        { ordem: field.ordem }
      );
    }
  }
}

