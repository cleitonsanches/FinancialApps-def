import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTemplate } from '../../database/entities/project-template.entity';
import { ProjectTemplateTask } from '../../database/entities/project-template-task.entity';

@Injectable()
export class ProjectTemplatesService {
  constructor(
    @InjectRepository(ProjectTemplate)
    private templateRepository: Repository<ProjectTemplate>,
    @InjectRepository(ProjectTemplateTask)
    private taskRepository: Repository<ProjectTemplateTask>,
  ) {}

  async findAll(companyId?: string): Promise<ProjectTemplate[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.templateRepository.find({ 
      where,
      relations: ['tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProjectTemplate> {
    return this.templateRepository.findOne({ 
      where: { id },
      relations: ['tasks'],
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
}

