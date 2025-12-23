import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTemplate } from '../../database/entities/project-template.entity';

@Injectable()
export class ProjectTemplatesService {
  constructor(
    @InjectRepository(ProjectTemplate)
    private templateRepository: Repository<ProjectTemplate>,
  ) {}

  async create(createTemplateDto: any, companyId: string) {
    const template = this.templateRepository.create({
      ...createTemplateDto,
      companyId,
    });
    return await this.templateRepository.save(template);
  }

  async findAll(companyId: string, serviceType?: string) {
    const where: any = { companyId };
    if (serviceType) {
      where.serviceType = serviceType;
    }
    
    const templates = await this.templateRepository.find({
      where,
      relations: ['tasks'],
      order: { name: 'ASC' },
    });
    
    // Adicionar contagem de tarefas para cada template
    return templates.map(template => ({
      ...template,
      tasksCount: template.tasks?.length || 0,
    }));
  }

  async findOne(id: string, companyId: string) {
    const template = await this.templateRepository.findOne({
      where: { id, companyId },
      relations: ['tasks'],
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

