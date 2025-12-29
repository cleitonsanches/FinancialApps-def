import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTemplate } from '../../database/entities/project-template.entity';
import { ProjectTemplateTask } from '../../database/entities/project-template-task.entity';
import { ProjectTemplatePhase } from '../../database/entities/project-template-phase.entity';

@Injectable()
export class ProjectTemplatesService {
  constructor(
    @InjectRepository(ProjectTemplate)
    private templateRepository: Repository<ProjectTemplate>,
    @InjectRepository(ProjectTemplateTask)
    private taskRepository: Repository<ProjectTemplateTask>,
    @InjectRepository(ProjectTemplatePhase)
    private phaseRepository: Repository<ProjectTemplatePhase>,
  ) {}

  async findAll(companyId?: string): Promise<ProjectTemplate[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.templateRepository.find({ 
      where,
      relations: ['phases', 'phases.tasks', 'tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProjectTemplate> {
    return this.templateRepository.findOne({ 
      where: { id },
      relations: ['phases', 'phases.tasks', 'tasks'],
    });
  }

  async create(templateData: Partial<ProjectTemplate>): Promise<ProjectTemplate> {
    const template = this.templateRepository.create(templateData);
    const savedTemplate = await this.templateRepository.save(template);
    return this.findOne(savedTemplate.id);
  }

  async createTask(taskData: Partial<ProjectTemplateTask>): Promise<ProjectTemplateTask> {
    const task = this.taskRepository.create(taskData);
    return this.taskRepository.save(task);
  }

  async update(id: string, templateData: Partial<ProjectTemplate>): Promise<ProjectTemplate> {
    await this.templateRepository.update(id, templateData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.templateRepository.delete(id);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.taskRepository.delete(taskId);
  }

  async updateTask(taskId: string, taskData: Partial<ProjectTemplateTask>): Promise<ProjectTemplateTask> {
    await this.taskRepository.update(taskId, taskData);
    return this.taskRepository.findOne({ where: { id: taskId } }) as Promise<ProjectTemplateTask>;
  }

  // Métodos para gerenciar fases
  async createPhase(phaseData: Partial<ProjectTemplatePhase>): Promise<ProjectTemplatePhase> {
    // Se não foi informada a ordem, buscar a última ordem e incrementar
    if (phaseData.ordem === undefined || phaseData.ordem === null) {
      const lastPhase = await this.phaseRepository.findOne({
        where: { templateId: phaseData.templateId },
        order: { ordem: 'DESC' },
      });
      phaseData.ordem = lastPhase ? lastPhase.ordem + 1 : 0;
    }

    const phase = this.phaseRepository.create(phaseData);
    return this.phaseRepository.save(phase);
  }

  async findAllPhases(templateId: string): Promise<ProjectTemplatePhase[]> {
    return this.phaseRepository.find({
      where: { templateId },
      relations: ['tasks'],
      order: { ordem: 'ASC' },
    });
  }

  async findOnePhase(id: string): Promise<ProjectTemplatePhase> {
    return this.phaseRepository.findOne({
      where: { id },
      relations: ['tasks', 'template'],
    });
  }

  async updatePhase(id: string, phaseData: Partial<ProjectTemplatePhase>): Promise<ProjectTemplatePhase> {
    await this.phaseRepository.update(id, phaseData);
    return this.findOnePhase(id);
  }

  async deletePhase(id: string): Promise<void> {
    await this.phaseRepository.delete(id);
  }

  async reorderPhases(templateId: string, phaseOrders: { id: string; ordem: number }[]): Promise<void> {
    for (const { id, ordem } of phaseOrders) {
      await this.phaseRepository.update(id, { ordem });
    }
  }
}

