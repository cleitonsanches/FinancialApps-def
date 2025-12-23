import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal } from '../../database/entities/proposal.entity';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { ProjectTemplate } from '../../database/entities/project-template.entity';
import { ProjectTemplateTask } from '../../database/entities/project-template-task.entity';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectTask)
    private projectTaskRepository: Repository<ProjectTask>,
    @InjectRepository(ProjectTemplate)
    private projectTemplateRepository: Repository<ProjectTemplate>,
    @InjectRepository(ProjectTemplateTask)
    private projectTemplateTaskRepository: Repository<ProjectTemplateTask>,
  ) {}

  async findAll(companyId?: string): Promise<Proposal[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.proposalRepository.find({ 
      where,
      relations: ['client', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Proposal> {
    return this.proposalRepository.findOne({ 
      where: { id },
      relations: ['client', 'user'],
    });
  }

  async create(proposalData: Partial<Proposal>): Promise<Proposal> {
    const proposal = this.proposalRepository.create(proposalData);
    return this.proposalRepository.save(proposal);
  }

  async update(id: string, proposalData: Partial<Proposal>): Promise<Proposal> {
    const existingProposal = await this.findOne(id);
    if (!existingProposal) {
      throw new Error('Proposta não encontrada');
    }

    // Lógica para lidar com mudanças de status
    if (proposalData.status && proposalData.status !== existingProposal.status) {
      const linkedProjects = await this.projectRepository.find({
        where: { proposalId: id },
        relations: ['tasks'],
      });

      // Se status mudou de FECHADA para outro (RASCUNHO, ENVIADA, etc.), deletar projetos e tarefas
      if (existingProposal.status === 'FECHADA' && 
          ['RASCUNHO', 'ENVIADA', 'RE_ENVIADA', 'REVISADA'].includes(proposalData.status)) {
        for (const project of linkedProjects) {
          if (project.tasks) {
            await this.projectTaskRepository.delete({ projectId: project.id });
          }
          await this.projectRepository.delete(project.id);
        }
      }

      // Se status mudou para DECLINADA, deletar projetos e tarefas
      if (proposalData.status === 'DECLINADA') {
        for (const project of linkedProjects) {
          if (project.tasks) {
            await this.projectTaskRepository.delete({ projectId: project.id });
          }
          await this.projectRepository.delete(project.id);
        }
      }

      // Se status mudou para CANCELADA, alterar status dos projetos e tarefas
      if (proposalData.status === 'CANCELADA') {
        for (const project of linkedProjects) {
          await this.projectRepository.update(project.id, { status: 'NEGOCIACAO_CANCELADA' });
          if (project.tasks) {
            await this.projectTaskRepository.update(
              { projectId: project.id },
              { status: 'CANCELADA' }
            );
          }
        }
      }
    }

    await this.proposalRepository.update(id, proposalData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.proposalRepository.delete(id);
  }

  async createProjectFromTemplate(proposalId: string, templateId: string, startDate: Date): Promise<any> {
    const proposal = await this.findOne(proposalId);
    if (!proposal) {
      throw new Error('Proposta não encontrada');
    }

    const template = await this.projectTemplateRepository.findOne({
      where: { id: templateId },
      relations: ['tasks'],
    });

    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Criar projeto
    const project = this.projectRepository.create({
      companyId: proposal.companyId,
      clientId: proposal.clientId,
      proposalId: proposal.id,
      templateId: template.id,
      name: template.name,
      description: template.description,
      serviceType: template.serviceType,
      dataInicio: startDate,
      status: 'PENDENTE',
    });

    const savedProject = await this.projectRepository.save(project);

    // Calcular e criar tarefas
    const tasks: ProjectTask[] = [];
    const taskMap = new Map<string, ProjectTask>();

    // Ordenar tarefas do template por ordem
    const sortedTemplateTasks = (template.tasks || []).sort((a, b) => a.ordem - b.ordem);

    for (const templateTask of sortedTemplateTasks) {
      let taskStartDate: Date;

      if (templateTask.diasAposInicioProjeto !== null && templateTask.diasAposInicioProjeto !== undefined) {
        // Tarefa baseada na data de início do projeto
        taskStartDate = new Date(startDate);
        taskStartDate.setDate(taskStartDate.getDate() + templateTask.diasAposInicioProjeto);
      } else if (templateTask.tarefaAnteriorId) {
        // Tarefa baseada na tarefa anterior
        const previousTask = taskMap.get(templateTask.tarefaAnteriorId);
        if (previousTask && previousTask.dataInicio) {
          taskStartDate = new Date(previousTask.dataInicio);
          taskStartDate.setDate(taskStartDate.getDate() + templateTask.duracaoPrevistaDias);
        } else {
          taskStartDate = new Date(startDate);
        }
      } else {
        taskStartDate = new Date(startDate);
      }

      const taskEndDate = new Date(taskStartDate);
      taskEndDate.setDate(taskEndDate.getDate() + templateTask.duracaoPrevistaDias);

      const task = this.projectTaskRepository.create({
        projectId: savedProject.id,
        name: templateTask.name,
        description: templateTask.description,
        dataInicio: taskStartDate,
        dataConclusao: taskEndDate,
        status: 'PENDENTE',
        ordem: templateTask.ordem,
      });

      const savedTask = await this.projectTaskRepository.save(task);
      tasks.push(savedTask);
      taskMap.set(templateTask.id, savedTask);
    }

    // Calcular data fim do projeto baseada na última tarefa
    if (tasks.length > 0) {
      const lastTask = tasks[tasks.length - 1];
      if (lastTask.dataConclusao) {
        savedProject.dataFim = lastTask.dataConclusao;
        await this.projectRepository.save(savedProject);
      }
    }

    return {
      project: {
        ...savedProject,
        dataInicio: savedProject.dataInicio ? savedProject.dataInicio.toISOString().split('T')[0] : null,
        dataFim: savedProject.dataFim ? savedProject.dataFim.toISOString().split('T')[0] : null,
      },
      tasks: tasks.map(task => ({
        ...task,
        dataInicio: task.dataInicio ? task.dataInicio.toISOString().split('T')[0] : null,
        dataConclusao: task.dataConclusao ? task.dataConclusao.toISOString().split('T')[0] : null,
      })),
    };
  }
}

