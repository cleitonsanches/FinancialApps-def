import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectTask)
    private projectTaskRepository: Repository<ProjectTask>,
    @InjectRepository(TimeEntry)
    private timeEntryRepository: Repository<TimeEntry>,
  ) {}

  async findAll(companyId?: string): Promise<Project[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.projectRepository.find({ 
      where,
      relations: ['client', 'proposal', 'template', 'tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Project> {
    return this.projectRepository.findOne({ 
      where: { id },
      relations: ['client', 'proposal', 'template', 'tasks'],
    });
  }

  async create(projectData: Partial<Project>): Promise<Project> {
    const project = this.projectRepository.create(projectData);
    return this.projectRepository.save(project);
  }

  async update(id: string, projectData: Partial<Project>): Promise<Project> {
    await this.projectRepository.update(id, projectData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.projectRepository.delete(id);
  }

  async findAllTasks(projectId?: string): Promise<ProjectTask[]> {
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    try {
      return await this.projectTaskRepository.find({ 
        where,
        relations: ['project', 'project.client', 'usuarioExecutor', 'usuarioResponsavel'],
        order: { ordem: 'ASC' },
      });
    } catch (error: any) {
      // Se houver erro relacionado a colunas que não existem, tentar sem carregar project
      if (error.message && (error.message.includes('proposal_id') || error.message.includes('client_id') || error.message.includes('no such column'))) {
        console.warn('Erro ao carregar relações, tentando sem project:', error.message);
        // Tentar sem carregar project para evitar problemas com colunas que podem não existir
        return await this.projectTaskRepository.find({ 
          where,
          relations: ['usuarioExecutor', 'usuarioResponsavel'],
          order: { ordem: 'ASC' },
        });
      }
      throw error;
    }
  }

  async createTask(projectId: string, taskData: Partial<ProjectTask>): Promise<ProjectTask> {
    const task = this.projectTaskRepository.create({
      ...taskData,
      projectId,
      status: taskData.status || 'PENDENTE',
    });
    return this.projectTaskRepository.save(task);
  }

  async createTaskStandalone(taskData: Partial<ProjectTask>): Promise<ProjectTask> {
    // Validar que pelo menos um vínculo existe
    if (!taskData.projectId && !taskData.proposalId && !taskData.clientId) {
      throw new Error('É necessário vincular a um Projeto, Negociação ou Cliente');
    }
    
    const task = this.projectTaskRepository.create({
      ...taskData,
      status: taskData.status || 'PENDENTE',
    });
    return this.projectTaskRepository.save(task);
  }

  async updateTask(projectId: string, taskId: string, taskData: Partial<ProjectTask>): Promise<ProjectTask> {
    // Mapear dataFimPrevista para dataConclusao se necessário
    const updateData: any = { ...taskData };
    if ('dataFimPrevista' in updateData) {
      updateData.dataConclusao = updateData.dataFimPrevista;
      delete updateData.dataFimPrevista;
    }
    await this.projectTaskRepository.update({ id: taskId, projectId }, updateData);
    return this.projectTaskRepository.findOne({ where: { id: taskId }, relations: ['usuarioExecutor', 'usuarioResponsavel'] });
  }

  async findTimeEntries(projectId?: string, proposalId?: string, clientId?: string): Promise<TimeEntry[]> {
    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (proposalId) {
      where.proposalId = proposalId;
    }
    if (clientId) {
      where.clientId = clientId;
    }
    try {
      return await this.timeEntryRepository.find({
        where,
        relations: ['task', 'user', 'project'],
        order: { data: 'DESC' },
      });
    } catch (error: any) {
      // Se houver erro relacionado a colunas que não existem, tentar sem as novas relações
      if (error.message && (error.message.includes('proposal_id') || error.message.includes('client_id') || error.message.includes('no such column'))) {
        console.warn('Erro ao carregar relações de time entries, tentando sem proposal/client:', error.message);
        return await this.timeEntryRepository.find({
          where,
          relations: ['task', 'user', 'project'],
          order: { data: 'DESC' },
        });
      }
      throw error;
    }
  }

  async createTimeEntry(timeEntryData: Partial<TimeEntry>): Promise<TimeEntry> {
    // Validar que pelo menos um vínculo existe
    if (!timeEntryData.projectId && !timeEntryData.proposalId && !timeEntryData.clientId) {
      throw new Error('É necessário vincular a um Projeto, Negociação ou Cliente');
    }
    
    const timeEntry = this.timeEntryRepository.create(timeEntryData);
    const saved = await this.timeEntryRepository.save(timeEntry);
    // Retornar sem carregar relações que podem não existir ainda
    try {
      return await this.timeEntryRepository.findOne({ 
        where: { id: saved.id },
        relations: ['task', 'user', 'project'],
      }) || saved;
    } catch (error: any) {
      // Se houver erro, retornar o saved sem relações
      return saved;
    }
  }

  async updateTimeEntry(entryId: string, timeEntryData: Partial<TimeEntry>): Promise<TimeEntry> {
    // Converter data se for string
    if (timeEntryData.data && typeof timeEntryData.data === 'string') {
      timeEntryData.data = new Date(timeEntryData.data);
    }
    
    // Validar que pelo menos um vínculo existe (se estiver sendo atualizado)
    const existingEntry = await this.timeEntryRepository.findOne({ where: { id: entryId } });
    if (existingEntry) {
      const hasProject = timeEntryData.projectId !== undefined ? timeEntryData.projectId : existingEntry.projectId;
      const hasProposal = timeEntryData.proposalId !== undefined ? timeEntryData.proposalId : existingEntry.proposalId;
      const hasClient = timeEntryData.clientId !== undefined ? timeEntryData.clientId : existingEntry.clientId;
      
      if (!hasProject && !hasProposal && !hasClient) {
        throw new Error('É necessário vincular a um Projeto, Negociação ou Cliente');
      }
    }
    
    await this.timeEntryRepository.update({ id: entryId }, timeEntryData);
    return this.timeEntryRepository.findOne({ 
      where: { id: entryId },
      relations: ['task', 'user', 'project'],
    });
  }

  async findTaskById(taskId: string): Promise<ProjectTask | null> {
    return this.projectTaskRepository.findOne({ 
      where: { id: taskId },
      relations: ['project'],
    });
  }
}

