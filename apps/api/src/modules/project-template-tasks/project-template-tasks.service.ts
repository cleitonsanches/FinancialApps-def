import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectTemplateTask } from '../../database/entities/project-template-task.entity';
import { ProjectTemplate } from '../../database/entities/project-template.entity';

@Injectable()
export class ProjectTemplateTasksService {
  constructor(
    @InjectRepository(ProjectTemplateTask)
    private taskRepository: Repository<ProjectTemplateTask>,
    @InjectRepository(ProjectTemplate)
    private templateRepository: Repository<ProjectTemplate>,
  ) {}

  async create(createTaskDto: any, templateId: string) {
    // Verificar se o template existe
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException('Template não encontrado');
    }

    // Se não foi informada ordem, usar a próxima disponível
    if (createTaskDto.ordem === undefined || createTaskDto.ordem === null) {
      const maxOrdem = await this.taskRepository
        .createQueryBuilder('task')
        .where('task.templateId = :templateId', { templateId })
        .select('MAX(task.ordem)', 'max')
        .getRawOne();
      
      createTaskDto.ordem = (maxOrdem?.max || 0) + 1;
    }

    // Se for modo de datas e houver tarefas anteriores, calcular data de início automaticamente
    if (createTaskDto.dataInicio && createTaskDto.dataConclusao && createTaskDto.ordem > 1) {
      const previousTask = await this.taskRepository.findOne({
        where: { templateId, ordem: createTaskDto.ordem - 1 },
        order: { ordem: 'DESC' },
      });

      if (previousTask && previousTask.dataConclusao && createTaskDto.diasAposTarefaAnterior !== undefined) {
        // Calcular data de início baseada na tarefa anterior + diasAposTarefaAnterior
        const dataFimAnterior = new Date(previousTask.dataConclusao);
        const diasApos = createTaskDto.diasAposTarefaAnterior || 0;
        dataFimAnterior.setDate(dataFimAnterior.getDate() + diasApos);
        createTaskDto.dataInicio = dataFimAnterior.toISOString().split('T')[0];
      }
    }

    // Filtrar campos null/undefined para evitar problemas com NOT NULL constraints
    const cleanDto: any = {
      templateId,
      name: createTaskDto.name,
      ordem: createTaskDto.ordem,
    };

    // Adicionar apenas campos que têm valor
    if (createTaskDto.description !== undefined && createTaskDto.description !== null) {
      cleanDto.description = createTaskDto.description;
    }
    if (createTaskDto.horasEstimadas !== undefined && createTaskDto.horasEstimadas !== null) {
      cleanDto.horasEstimadas = createTaskDto.horasEstimadas;
    }
    if (createTaskDto.duracaoPrevistaDias !== undefined && createTaskDto.duracaoPrevistaDias !== null) {
      cleanDto.duracaoPrevistaDias = createTaskDto.duracaoPrevistaDias;
    }
    if (createTaskDto.dataInicio !== undefined && createTaskDto.dataInicio !== null) {
      cleanDto.dataInicio = createTaskDto.dataInicio;
    }
    if (createTaskDto.dataConclusao !== undefined && createTaskDto.dataConclusao !== null) {
      cleanDto.dataConclusao = createTaskDto.dataConclusao;
    }
    if (createTaskDto.diasAposInicioProjeto !== undefined && createTaskDto.diasAposInicioProjeto !== null) {
      cleanDto.diasAposInicioProjeto = createTaskDto.diasAposInicioProjeto;
    }
    if (createTaskDto.diasAposTarefaAnterior !== undefined && createTaskDto.diasAposTarefaAnterior !== null) {
      cleanDto.diasAposTarefaAnterior = createTaskDto.diasAposTarefaAnterior;
    }
    if (createTaskDto.tarefaAnteriorId !== undefined && createTaskDto.tarefaAnteriorId !== null && createTaskDto.tarefaAnteriorId !== '') {
      cleanDto.tarefaAnteriorId = createTaskDto.tarefaAnteriorId;
    }
    if (createTaskDto.responsavelId !== undefined && createTaskDto.responsavelId !== null && createTaskDto.responsavelId !== '') {
      cleanDto.responsavelId = createTaskDto.responsavelId;
    }
    if (createTaskDto.executorId !== undefined && createTaskDto.executorId !== null && createTaskDto.executorId !== '') {
      cleanDto.executorId = createTaskDto.executorId;
    }
    if (createTaskDto.executorTipo !== undefined && createTaskDto.executorTipo !== null) {
      cleanDto.executorTipo = createTaskDto.executorTipo;
    }

    const task = this.taskRepository.create(cleanDto);
    return await this.taskRepository.save(task);
  }

  async findAllByTemplate(templateId: string) {
    return await this.taskRepository.find({
      where: { templateId },
      order: { ordem: 'ASC' },
    });
  }

  async findOne(id: string, templateId: string) {
    const task = await this.taskRepository.findOne({
      where: { id, templateId },
    });

    if (!task) {
      throw new NotFoundException('Tarefa não encontrada');
    }

    return task;
  }

  async update(id: string, updateTaskDto: any, templateId: string) {
    // Filtrar campos null/undefined para evitar problemas com NOT NULL constraints
    const cleanDto: any = {};
    
    // Adicionar apenas campos que têm valor
    Object.keys(updateTaskDto).forEach(key => {
      if (updateTaskDto[key] !== undefined && updateTaskDto[key] !== null) {
        cleanDto[key] = updateTaskDto[key];
      }
    });

    await this.taskRepository.update({ id, templateId }, cleanDto);
    return await this.findOne(id, templateId);
  }

  async remove(id: string, templateId: string) {
    await this.taskRepository.delete({ id, templateId });
  }

  async updateOrder(tasks: Array<{ id: string; ordem: number }>, templateId: string) {
    for (const task of tasks) {
      await this.taskRepository.update(
        { id: task.id, templateId },
        { ordem: task.ordem }
      );
    }
    return { success: true };
  }
}

