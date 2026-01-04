import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { Proposal } from '../../database/entities/proposal.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { ChartOfAccounts } from '../../database/entities/chart-of-accounts.entity';
import { Client } from '../../database/entities/client.entity';
import { TaskComment } from '../../database/entities/task-comment.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(ProjectTask)
    private projectTaskRepository: Repository<ProjectTask>,
    @InjectRepository(TimeEntry)
    private timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(TaskComment)
    private taskCommentRepository: Repository<TaskComment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(companyId?: string): Promise<Project[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.projectRepository.find({ 
      where,
      relations: ['client', 'proposal', 'template', 'tasks', 'phases'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Project> {
    return this.projectRepository.findOne({ 
      where: { id },
      relations: ['client', 'proposal', 'template', 'tasks', 'phases', 'phases.tasks'],
    });
  }

  async create(projectData: Partial<Project>): Promise<Project> {
    // Garantir que clientId seja null se não fornecido (em vez de undefined)
    const dataToCreate = {
      ...projectData,
      clientId: projectData.clientId || null,
    };
    const project = this.projectRepository.create(dataToCreate);
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
      // Usar query builder para incluir campos com select: false
      const queryBuilder = this.projectTaskRepository
        .createQueryBuilder('task')
        .leftJoinAndSelect('task.project', 'project')
        .leftJoinAndSelect('project.client', 'projectClient')
        .leftJoinAndSelect('project.proposal', 'projectProposal')
        .leftJoinAndSelect('task.proposal', 'proposal')
        .leftJoinAndSelect('task.client', 'client')
        .leftJoinAndSelect('task.usuarioExecutor', 'usuarioExecutor')
        .leftJoinAndSelect('task.usuarioResponsavel', 'usuarioResponsavel')
        .leftJoinAndSelect('task.phase', 'phase')
        .addSelect('task.proposal_id', 'proposal_id')
        .addSelect('task.client_id', 'client_id')
        .orderBy('task.ordem', 'ASC');
      
      if (projectId) {
        queryBuilder.where('task.project_id = :projectId', { projectId });
      }
      
      const tasks = await queryBuilder.getMany();
      
      // Garantir que os campos proposal_id e client_id estejam disponíveis
      // Mesmo com addSelect, eles podem não estar no objeto retornado
      // Vamos fazer uma query raw adicional para obter esses valores
      if (tasks.length > 0) {
        const taskIds = tasks.map(t => t.id);
        const queryRunner = this.projectTaskRepository.manager.connection.createQueryRunner();
        const rawTasks = await queryRunner.query(
          `SELECT id, proposal_id, client_id FROM project_tasks WHERE id IN (${taskIds.map(() => '?').join(',')})`,
          taskIds
        );
        await queryRunner.release();
        
        // Mapear os valores raw para as tarefas
        const rawMap = new Map(rawTasks.map((rt: any) => [rt.id, { proposalId: rt.proposal_id, clientId: rt.client_id }]));
        tasks.forEach(task => {
          const raw = rawMap.get(task.id) as { proposalId?: string; clientId?: string } | undefined;
          if (raw) {
            (task as any).proposalId = raw.proposalId;
            (task as any).clientId = raw.clientId;
          }
        });
      }
      
      return tasks;
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

  // Função helper para limpar campos UUID, numéricos e datas: converter strings vazias para null/0
  private cleanUuidFields(data: any): any {
    const uuidFields = ['projectId', 'proposalId', 'clientId', 'phaseId', 'usuarioResponsavelId', 'usuarioExecutorId'];
    const numericFields = ['ordem']; // Campos numéricos que não podem receber strings vazias
    const stringFields = ['horasEstimadas']; // Campos string que podem receber números do frontend
    const dateFields = ['dataInicio', 'dataConclusao', 'dataFimPrevista', 'conclusaoEfetiva']; // Campos de data
    const cleaned = { ...data };
    
    // Limpar campos UUID
    for (const field of uuidFields) {
      // Se o campo existe no objeto (mesmo que seja undefined/null/string vazia)
      if (field in cleaned) {
        const value = cleaned[field];
        
        // Se for undefined, remover do objeto
        if (value === undefined) {
          delete cleaned[field];
        }
        // Se for null, manter null (já está correto)
        else if (value === null) {
          // Manter null, não fazer nada
        }
        // Se for string vazia ou apenas espaços, converter para null
        else if (typeof value === 'string' && value.trim() === '') {
          cleaned[field] = null;
        }
        // Se for string não vazia, verificar se é UUID válido (opcional, apenas para debug)
        else if (typeof value === 'string' && value.trim() !== '') {
          // Manter o valor, mas garantir que não seja apenas espaços
          cleaned[field] = value.trim();
        }
      }
    }
    
    // Limpar campos numéricos
    for (const field of numericFields) {
      if (field in cleaned) {
        const value = cleaned[field];
        
        // Se for undefined, remover do objeto (deixar TypeORM usar default)
        if (value === undefined) {
          delete cleaned[field];
        }
        // Se for null, manter null
        else if (value === null) {
          // Manter null
        }
        // Se for string vazia ou apenas espaços, converter para 0 (ou remover para usar default)
        else if (typeof value === 'string' && value.trim() === '') {
          delete cleaned[field]; // Remover para usar valor default (0)
        }
        // Se for string numérica, converter para número
        else if (typeof value === 'string' && value.trim() !== '') {
          const numValue = parseInt(value.trim(), 10);
          if (!isNaN(numValue)) {
            cleaned[field] = numValue;
          } else {
            // Se não for número válido, remover para usar default
            delete cleaned[field];
          }
        }
        // Se já for número, garantir que não seja NaN
        else if (typeof value === 'number' && isNaN(value)) {
          delete cleaned[field];
        }
      }
    }
    
    // Limpar campos string (que podem receber números do frontend)
    for (const field of stringFields) {
      if (field in cleaned) {
        const value = cleaned[field];
        
        // Se for undefined, remover do objeto
        if (value === undefined) {
          delete cleaned[field];
        }
        // Se for null, manter null
        else if (value === null) {
          // Manter null
        }
        // Se for número, converter para string (horasEstimadas é varchar no banco)
        else if (typeof value === 'number') {
          if (isNaN(value)) {
            delete cleaned[field];
          } else {
            cleaned[field] = value.toString();
          }
        }
        // Se for string vazia ou apenas espaços, converter para null
        else if (typeof value === 'string' && value.trim() === '') {
          cleaned[field] = null;
        }
        // Se for string não vazia, manter (mas trim)
        else if (typeof value === 'string' && value.trim() !== '') {
          cleaned[field] = value.trim();
        }
      }
    }
    
    // Limpar campos de data
    for (const field of dateFields) {
      if (field in cleaned) {
        const value = cleaned[field];
        
        // Se for undefined, remover do objeto
        if (value === undefined) {
          delete cleaned[field];
        }
        // Se for null, manter null
        else if (value === null) {
          // Manter null
        }
        // Se for string vazia ou apenas espaços, converter para null
        else if (typeof value === 'string' && value.trim() === '') {
          cleaned[field] = null;
        }
        // Se for string não vazia, converter para Date
        else if (typeof value === 'string' && value.trim() !== '') {
          const dateValue = new Date(value.trim());
          if (!isNaN(dateValue.getTime())) {
            cleaned[field] = dateValue;
          } else {
            cleaned[field] = null;
          }
        }
        // Se já for Date, garantir que não seja inválido
        else if (value instanceof Date) {
          if (isNaN(value.getTime())) {
            cleaned[field] = null;
          }
        }
      }
    }
    
    return cleaned;
  }

  async createTask(projectId: string, taskData: Partial<ProjectTask>): Promise<ProjectTask> {
    // Limpar campos UUID: converter strings vazias para null (SQL Server não aceita string vazia em campos GUID)
    const cleanProjectId = projectId && typeof projectId === 'string' && projectId.trim() !== '' ? projectId : null;
    const cleanedTaskData = this.cleanUuidFields({
      ...taskData,
      projectId: cleanProjectId,
    });
    
    const task = this.projectTaskRepository.create({
      ...cleanedTaskData,
      status: cleanedTaskData.status || 'PENDENTE',
    });
    const saved = await this.projectTaskRepository.save(task);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async createTaskStandalone(taskData: Partial<ProjectTask>): Promise<ProjectTask> {
    // Limpar campos UUID: converter strings vazias para null (SQL Server não aceita string vazia em campos GUID)
    const cleanedTaskData = this.cleanUuidFields(taskData);
    
    // Validar que pelo menos um vínculo existe
    if (!cleanedTaskData.projectId && !cleanedTaskData.proposalId && !cleanedTaskData.clientId) {
      throw new Error('É necessário vincular a um Projeto, Negociação ou Cliente');
    }
    
    // Se não foi especificado, verificar se deve exigir lançamento de horas
    if (cleanedTaskData.exigirLancamentoHoras === undefined) {
      // Se está vinculado a uma negociação, verificar se é "Por Horas"
      if (cleanedTaskData.proposalId) {
        const proposal = await this.proposalRepository.findOne({
          where: { id: cleanedTaskData.proposalId },
          select: ['tipoContratacao']
        });
        if (proposal && proposal.tipoContratacao === 'HORAS') {
          cleanedTaskData.exigirLancamentoHoras = true;
        }
      }
      // Se está vinculado a um projeto, verificar se o projeto está vinculado a uma negociação "Por Horas"
      else if (cleanedTaskData.projectId) {
        const project = await this.projectRepository.findOne({
          where: { id: cleanedTaskData.projectId },
          relations: ['proposal'],
          select: ['id', 'proposal']
        });
        if (project?.proposal?.tipoContratacao === 'HORAS') {
          cleanedTaskData.exigirLancamentoHoras = true;
        }
      }
    }
    
    const task = this.projectTaskRepository.create({
      ...cleanedTaskData,
      status: cleanedTaskData.status || 'PENDENTE',
    });
    const saved = await this.projectTaskRepository.save(task);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateTask(projectId: string | null | undefined, taskId: string, taskData: Partial<ProjectTask>): Promise<ProjectTask> {
    // Buscar a tarefa atual para verificar se exige lançamento de horas
    const currentTask = await this.projectTaskRepository.findOne({ 
      where: { id: taskId },
      relations: ['project', 'project.proposal', 'proposal']
    });
    
    if (!currentTask) {
      throw new BadRequestException('Tarefa não encontrada');
    }
    
    // Verificar se a tarefa exige lançamento de horas:
    // 1. Se tem o campo exigirLancamentoHoras = true
    // 2. Se está vinculada a uma negociação "Por Horas"
    // 3. Se está vinculada a um projeto que está vinculado a uma negociação "Por Horas"
    let exigeLancamentoHoras = currentTask.exigirLancamentoHoras || false;
    
    if (!exigeLancamentoHoras) {
      // Verificar se está vinculada a uma negociação "Por Horas"
      if (currentTask.proposalId) {
        const proposal = await this.proposalRepository.findOne({
          where: { id: currentTask.proposalId },
          select: ['tipoContratacao']
        });
        if (proposal && proposal.tipoContratacao === 'HORAS') {
          exigeLancamentoHoras = true;
        }
      }
      // Verificar se está vinculada a um projeto que está vinculado a uma negociação "Por Horas"
      else if (currentTask.projectId || currentTask.project) {
        const projectIdToCheck = currentTask.projectId || currentTask.project?.id;
        if (projectIdToCheck) {
          const project = await this.projectRepository.findOne({
            where: { id: projectIdToCheck },
            relations: ['proposal'],
            select: ['id']
          });
          if (project?.proposal?.tipoContratacao === 'HORAS') {
            exigeLancamentoHoras = true;
          }
        }
      }
    }
    
    // Se está tentando concluir e a tarefa exige lançamento de horas, validar
    if (taskData.status === 'CONCLUIDA' && exigeLancamentoHoras) {
      // Verificar se há horas lançadas para esta tarefa
      const timeEntries = await this.timeEntryRepository.find({
        where: { taskId: taskId }
      });
      
      const totalHoras = timeEntries.reduce((sum, entry) => {
        const horas = typeof entry.horas === 'number' ? entry.horas : parseFloat(String(entry.horas)) || 0;
        return sum + horas;
      }, 0);
      
      if (totalHoras === 0) {
        throw new BadRequestException('Esta tarefa exige lançamento de horas antes de ser concluída. Por favor, registre as horas trabalhadas primeiro.');
      }
    }
    
    // Mapear dataFimPrevista para dataConclusao se necessário (o frontend usa dataFimPrevista, mas o banco tem dataConclusao)
    const updateData: any = { ...taskData };
    if ('dataFimPrevista' in updateData) {
      updateData.dataConclusao = updateData.dataFimPrevista;
      delete updateData.dataFimPrevista;
    }
    
    // Se o status está mudando para CONCLUIDA, registrar a data de conclusão efetiva
    if (taskData.status === 'CONCLUIDA' && currentTask.status !== 'CONCLUIDA') {
      updateData.conclusaoEfetiva = new Date();
    }
    
    // Limpar campos UUID, numéricos e datas: converter strings vazias para null (SQL Server não aceita string vazia em campos GUID)
    const cleanedUpdateData = this.cleanUuidFields(updateData);
    
    // Se projectId for null/undefined, usar apenas taskId no update
    if (projectId) {
      await this.projectTaskRepository.update({ id: taskId, projectId }, cleanedUpdateData);
    } else {
      await this.projectTaskRepository.update({ id: taskId }, cleanedUpdateData);
    }
    
    return this.projectTaskRepository.findOne({ where: { id: taskId }, relations: ['usuarioExecutor', 'usuarioResponsavel'] });
  }

  async findTimeEntriesByIds(ids: string[]): Promise<TimeEntry[]> {
    console.log('Service recebeu IDs para buscar:', ids);
    console.log('Quantidade de IDs:', ids.length);
    
    if (!ids || ids.length === 0) {
      console.warn('Nenhum ID fornecido');
      return [];
    }
    
    try {
      // Verificar se há entries no banco usando query SQL direta
      const queryRunner = this.timeEntryRepository.manager.connection.createQueryRunner();
      const totalEntries = await queryRunner.query('SELECT COUNT(*) as count FROM time_entries');
      console.log('Total de entries no banco de dados:', totalEntries[0]?.count || 0);
      
      // Verificar se os IDs específicos existem
      const placeholders = ids.map(() => '?').join(',');
      const existingIds = await queryRunner.query(
        `SELECT id FROM time_entries WHERE id IN (${placeholders})`,
        ids
      );
      console.log('IDs encontrados no banco (query SQL direta):', existingIds.length);
      console.log('IDs encontrados:', existingIds.map((e: any) => e.id));
      
      await queryRunner.release();
      
      if (existingIds.length === 0) {
        console.warn('Nenhuma entry encontrada com os IDs fornecidos. IDs buscados:', ids);
        return [];
      }
      
      // Agora buscar com TypeORM e relações
      const entries = await this.timeEntryRepository.find({
        where: { id: In(ids) },
        relations: ['task', 'user', 'aprovador', 'reprovador', 'project', 'project.client', 'project.proposal', 'proposal', 'proposal.client', 'client'],
        order: { data: 'DESC' },
      });
      console.log('Service encontrou entries com relações:', entries.length);
      return entries;
    } catch (error: any) {
      console.error('Erro ao buscar entries por IDs:', error);
      console.error('Detalhes do erro:', error.message);
      console.error('Stack trace:', error.stack);
      // Se houver erro relacionado a colunas que não existem, tentar sem as novas relações
      if (error.message && (error.message.includes('proposal_id') || error.message.includes('client_id') || error.message.includes('no such column'))) {
        console.warn('Erro ao carregar relações de time entries, tentando sem proposal/client:', error.message);
        try {
          const entries = await this.timeEntryRepository.find({
            where: { id: In(ids) },
            relations: ['task', 'user', 'aprovador', 'reprovador', 'project', 'project.client'],
            order: { data: 'DESC' },
          });
          console.log('Service encontrou entries (sem proposal/client):', entries.length);
          return entries;
        } catch (error2: any) {
          console.error('Erro mesmo sem proposal/client:', error2);
          // Última tentativa: buscar apenas os campos básicos
          return await this.timeEntryRepository.find({
            where: { id: In(ids) },
            relations: ['task', 'user', 'aprovador', 'reprovador', 'project'],
            order: { data: 'DESC' },
          });
        }
      }
      throw error;
    }
  }

  async findTimeEntries(projectId?: string, proposalId?: string, clientId?: string): Promise<TimeEntry[]> {
    console.log('findTimeEntries chamado com:', { projectId, proposalId, clientId });
    
    try {
      // Se nenhum filtro foi fornecido, retornar todas as entries
      if (!projectId && !proposalId && !clientId) {
        console.log('Nenhum filtro fornecido, buscando todas as entries');
        const entries = await this.timeEntryRepository.find({
          relations: ['task', 'user', 'aprovador', 'reprovador', 'project', 'project.client', 'proposal', 'proposal.client', 'client'],
          order: { data: 'DESC' },
        });
        console.log('findTimeEntries encontrou:', entries.length, 'entries (sem filtro)');
        return entries;
      }
      
      // Se há filtros, construir where clause
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
      console.log('Where clause:', where);
      
      const entries = await this.timeEntryRepository.find({
        where,
          relations: ['task', 'user', 'aprovador', 'reprovador', 'project', 'project.client', 'proposal', 'proposal.client', 'client'],
        order: { data: 'DESC' },
      });
      console.log('findTimeEntries encontrou:', entries.length, 'entries');
      return entries;
    } catch (error: any) {
      console.error('Erro em findTimeEntries:', error);
      // Se houver erro relacionado a colunas que não existem, tentar sem as novas relações
      if (error.message && (error.message.includes('proposal_id') || error.message.includes('client_id') || error.message.includes('no such column'))) {
        console.warn('Erro ao carregar relações de time entries, tentando sem proposal/client:', error.message);
        
        // Tentar sem filtros primeiro
        if (!projectId && !proposalId && !clientId) {
          const entries = await this.timeEntryRepository.find({
            relations: ['task', 'user', 'aprovador', 'reprovador', 'project', 'project.client'],
            order: { data: 'DESC' },
          });
          console.log('findTimeEntries encontrou (sem proposal/client, sem filtro):', entries.length, 'entries');
          return entries;
        }
        
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
        
        const entries = await this.timeEntryRepository.find({
          where,
          relations: ['task', 'user', 'aprovador', 'reprovador', 'project', 'project.client'],
          order: { data: 'DESC' },
        });
        console.log('findTimeEntries encontrou (sem proposal/client):', entries.length, 'entries');
        return entries;
      }
      throw error;
    }
  }

  async createTimeEntry(timeEntryData: Partial<TimeEntry>): Promise<TimeEntry> {
    console.log('createTimeEntry - dados recebidos:', {
      taskId: timeEntryData.taskId,
      projectId: timeEntryData.projectId,
      proposalId: timeEntryData.proposalId,
      clientId: timeEntryData.clientId
    });
    
    // Se houver taskId mas não houver vínculos diretos, buscar a tarefa para obter os vínculos
    if (timeEntryData.taskId && (!timeEntryData.projectId && !timeEntryData.proposalId && !timeEntryData.clientId)) {
      try {
        console.log('Buscando tarefa para obter vínculos, taskId:', timeEntryData.taskId);
        
        // Usar query raw para buscar campos com select: false diretamente do banco
        const queryRunner = this.projectTaskRepository.manager.connection.createQueryRunner();
        const rawTask = await queryRunner.query(
          `SELECT 
            id,
            project_id,
            proposal_id,
            client_id
          FROM project_tasks 
          WHERE id = ?`,
          [timeEntryData.taskId]
        );
        await queryRunner.release();
        
        console.log('Dados raw da tarefa (SQL):', rawTask);
        
        // Buscar a tarefa completa com relações para obter dados do projeto/proposal/client
        const task = await this.projectTaskRepository
          .createQueryBuilder('task')
          .leftJoinAndSelect('task.project', 'project')
          .leftJoinAndSelect('project.proposal', 'projectProposal')
          .leftJoinAndSelect('project.client', 'projectClient')
          .leftJoinAndSelect('task.proposal', 'proposal')
          .leftJoinAndSelect('task.client', 'client')
          .where('task.id = :taskId', { taskId: timeEntryData.taskId })
          .getOne();
        
        const taskData = rawTask && rawTask.length > 0 ? rawTask[0] : null;
        
        if (task || taskData) {
          console.log('Tarefa encontrada:', {
            taskId: task?.id || taskData?.id,
            projectId: taskData?.project_id || task?.projectId,
            proposalId: taskData?.proposal_id,
            clientId: taskData?.client_id,
            project: task?.project ? { 
              id: task.project.id, 
              clientId: task.project.clientId, 
              proposalId: task.project.proposalId 
            } : null,
            proposal: task?.proposal ? { 
              id: task.proposal.id, 
              clientId: task.proposal.clientId 
            } : null,
            client: task?.client ? { id: task.client.id } : null
          });
          
          // Obter projectId da tarefa ou do projeto relacionado
          if (!timeEntryData.projectId) {
            timeEntryData.projectId = taskData?.project_id || task?.projectId || (task?.project as any)?.id || null;
            console.log('projectId obtido:', timeEntryData.projectId);
          }
          
          // Obter proposalId da tarefa, do projeto ou da negociação relacionada
          if (!timeEntryData.proposalId) {
            const taskProposalId = taskData?.proposal_id;
            const projectProposalId = task?.project?.proposalId || (task?.project as any)?.proposal?.id;
            timeEntryData.proposalId = taskProposalId || projectProposalId || null;
            console.log('proposalId obtido:', timeEntryData.proposalId);
          }
          
          // Obter clientId da tarefa, do projeto ou da negociação relacionada
          if (!timeEntryData.clientId) {
            const taskClientId = taskData?.client_id;
            const projectClientId = task?.project?.clientId || (task?.project as any)?.client?.id;
            const proposalClientId = (task?.proposal as any)?.clientId || (task?.project as any)?.proposal?.clientId;
            timeEntryData.clientId = taskClientId || projectClientId || proposalClientId || null;
            console.log('clientId obtido:', timeEntryData.clientId);
          }
        } else {
          console.warn('Tarefa não encontrada com ID:', timeEntryData.taskId);
        }
      } catch (error: any) {
        console.error('Erro ao buscar tarefa para obter vínculos:', error);
        console.error('Stack:', error.stack);
        // Continuar mesmo se houver erro ao buscar a tarefa
      }
    }
    
    console.log('createTimeEntry - vínculos após busca:', {
      projectId: timeEntryData.projectId,
      proposalId: timeEntryData.proposalId,
      clientId: timeEntryData.clientId
    });
    
    // Validar que pelo menos um vínculo existe
    if (!timeEntryData.projectId && !timeEntryData.proposalId && !timeEntryData.clientId) {
      console.error('Erro: Nenhum vínculo encontrado após busca da tarefa');
      throw new Error('É necessário vincular a um Projeto, Negociação ou Cliente');
    }
    
    // Garantir que isFaturavel seja salvo corretamente (pode vir como string 'true' do frontend)
    if (timeEntryData.isFaturavel !== undefined) {
      const isFaturavelValue = timeEntryData.isFaturavel;
      timeEntryData.isFaturavel = isFaturavelValue === true || 
                                   (typeof isFaturavelValue === 'string' && isFaturavelValue === 'true') || 
                                   (typeof isFaturavelValue === 'number' && isFaturavelValue === 1);
    }
    
    const timeEntry = this.timeEntryRepository.create(timeEntryData);
    const saved = await this.timeEntryRepository.save(timeEntry);
    
    // Se houver proposalId e a negociação for do tipo "Por hora", criar conta a receber
    if (saved.proposalId) {
      try {
        const proposal = await this.proposalRepository.findOne({ 
          where: { id: saved.proposalId },
          select: ['tipoContratacao', 'status', 'valorPorHora', 'clientId', 'companyId', 'serviceType']
        });
        
        if (proposal && proposal.tipoContratacao === 'HORAS' && proposal.status === 'FECHADA') {
          // Para negociações "Por hora", sempre criar conta a receber quando houver horas lançadas
          // Buscar classificação de honorários (NÃO criar automaticamente)
          let chartOfAccountsId: string | null = null;
          if (proposal.serviceType) {
            const serviceTypeNames: Record<string, string> = {
              'ANALISE_DADOS': 'Análise de Dados',
              'ASSINATURAS': 'Assinaturas',
              'AUTOMACOES': 'Automações',
              'CONSULTORIA': 'Consultoria',
              'DESENVOLVIMENTOS': 'Desenvolvimentos',
              'MANUTENCOES': 'Manutenções',
              'MIGRACAO_DADOS': 'Migração de Dados',
              'TREINAMENTO': 'Treinamento',
              'TREINAMENTOS': 'Treinamento', // Variação comum
              'CONTRATO_FIXO': 'Contrato Fixo',
            };
            
            const nomeTipoServico = serviceTypeNames[proposal.serviceType] || proposal.serviceType;
            const nomeClassificacao = `Honorários - ${nomeTipoServico}`;
            
            // Buscar classificação existente
            let classificacao = await this.chartOfAccountsRepository.findOne({
              where: {
                companyId: proposal.companyId,
                name: nomeClassificacao,
                type: 'RECEITA'
              }
            });
            
            // Se não encontrou pelo nome exato, tentar busca mais flexível
            if (!classificacao) {
              const allClassifications = await this.chartOfAccountsRepository.find({
                where: {
                  companyId: proposal.companyId,
                  type: 'RECEITA'
                }
              });
              
              // Procurar por nome similar
              classificacao = allClassifications.find(c => 
                c.name.toLowerCase().includes('honorários') && 
                c.name.toLowerCase().includes(nomeTipoServico.toLowerCase())
              ) || null;
            }
            
            // NÃO criar automaticamente - apenas usar se encontrado
            if (classificacao) {
              chartOfAccountsId = classificacao.id;
            } else {
              console.warn(`⚠️  Classificação "${nomeClassificacao}" não encontrada. Crie manualmente no Plano de Contas.`);
            }
          }
          
          // Calcular valor: horas * valorPorHora
          const horas = typeof saved.horas === 'number' ? saved.horas : parseFloat(String(saved.horas)) || 0;
          const valorPorHora = proposal.valorPorHora || 0;
          const valorTotal = horas * valorPorHora;
          
          if (valorTotal > 0) {
            // Calcular data de vencimento (30 dias após a data de emissão, ou usar vencimento da negociação)
            const emissionDate = new Date(saved.data);
            let dueDate = new Date(emissionDate);
            dueDate.setDate(dueDate.getDate() + 30); // Padrão: 30 dias
            
            // Criar conta a receber com número único incluindo ID do time entry
            const dataStr = emissionDate.toISOString().split('T')[0];
            const invoiceNumber = `NEG-${saved.proposalId.substring(0, 4)}-HORAS-${dataStr}-${saved.id.substring(0, 4)}`;
            const invoice = this.invoiceRepository.create({
              companyId: proposal.companyId,
              clientId: proposal.clientId,
              proposalId: saved.proposalId,
              chartOfAccountsId,
              invoiceNumber,
              emissionDate: saved.data,
              dueDate: dueDate,
              grossValue: valorTotal,
              status: 'PROVISIONADA',
              origem: 'NEGOCIACAO',
            });
            
            await this.invoiceRepository.save(invoice);
            console.log(`✅ Conta a receber criada automaticamente para negociação ${saved.proposalId} com ${horas}h a R$ ${valorPorHora}/h = R$ ${valorTotal.toFixed(2)}`);
          }
        }
      } catch (error: any) {
        // Log do erro mas não falhar a criação do time entry
        console.error('Erro ao criar conta a receber automaticamente:', error.message);
      }
    }
    
    // Retornar sem carregar relações que podem não existir ainda
    try {
      return await this.timeEntryRepository.findOne({ 
        where: { id: saved.id },
        relations: ['task', 'user', 'aprovador', 'reprovador', 'project'],
      }) || saved;
    } catch (error: any) {
      // Se houver erro, retornar o saved sem relações
      return saved;
    }
  }

  async updateTimeEntry(entryId: string, timeEntryData: Partial<TimeEntry>, userId?: string): Promise<TimeEntry> {
    // Converter data se for string
    if (timeEntryData.data && typeof timeEntryData.data === 'string') {
      timeEntryData.data = new Date(timeEntryData.data);
    }
    
    // Validar que pelo menos um vínculo existe (se estiver sendo atualizado)
    const existingEntry = await this.timeEntryRepository.findOne({ 
      where: { id: entryId },
      relations: ['project', 'proposal', 'client'],
    });
    
    if (existingEntry) {
      // Só validar vínculos se estivermos atualizando os campos de vínculo
      // Se apenas estivermos atualizando status ou outros campos, usar os vínculos existentes
      const isUpdatingVinculos = timeEntryData.projectId !== undefined || 
                                  timeEntryData.proposalId !== undefined || 
                                  timeEntryData.clientId !== undefined;
      
      if (isUpdatingVinculos) {
        const hasProject = timeEntryData.projectId !== undefined ? timeEntryData.projectId : existingEntry.projectId;
        const hasProposal = timeEntryData.proposalId !== undefined ? timeEntryData.proposalId : existingEntry.proposalId;
        const hasClient = timeEntryData.clientId !== undefined ? timeEntryData.clientId : existingEntry.clientId;
        
        if (!hasProject && !hasProposal && !hasClient) {
          throw new Error('É necessário vincular a um Projeto, Negociação ou Cliente');
        }
      }

      // Se está mudando para REPROVADA, salvar informações de reprovação
      if (timeEntryData.status === 'REPROVADA' && existingEntry.status !== 'REPROVADA') {
        // Se estava APROVADA, remover da invoice
        if (existingEntry.status === 'APROVADA') {
          await this.removeTimeEntryFromInvoice(entryId, existingEntry);
        }
        // Salvar informações de reprovação (sempre que muda para REPROVADA)
        timeEntryData.reprovadoEm = new Date();
        if (userId) {
          timeEntryData.reprovadoPor = userId;
        }
        console.log('Salvando informações de reprovação:', {
          entryId,
          reprovadoEm: timeEntryData.reprovadoEm,
          reprovadoPor: timeEntryData.reprovadoPor,
          userId
        });
      }
    }
    
    await this.timeEntryRepository.update({ id: entryId }, timeEntryData);
    return this.timeEntryRepository.findOne({ 
      where: { id: entryId },
      relations: ['task', 'user', 'aprovador', 'reprovador', 'project'],
    });
  }

  private async removeTimeEntryFromInvoice(entryId: string, timeEntry: TimeEntry): Promise<void> {
    try {
      // Buscar todas as invoices que contêm esta hora no approvedTimeEntries
      const allInvoices = await this.invoiceRepository.find({
        where: {
          origem: 'TIMESHEET',
        },
      });

      // Encontrar a invoice que contém esta hora
      let invoiceToUpdate: Invoice | null = null;
      for (const invoice of allInvoices) {
        if (!invoice.approvedTimeEntries) continue;
        
        try {
          const approvedEntries: string[] = JSON.parse(invoice.approvedTimeEntries);
          if (approvedEntries.includes(entryId)) {
            invoiceToUpdate = invoice;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!invoiceToUpdate) {
        // Se não encontrou invoice, não há nada a fazer
        return;
      }

      // Calcular valor da hora para subtrair
      let valorPorHora = 0;
      let proposal: Proposal | null = null;

      // Buscar valor por hora da negociação
      if (timeEntry.proposalId) {
        proposal = await this.proposalRepository.findOne({
          where: { id: timeEntry.proposalId },
        });
        if (proposal && proposal.tipoContratacao === 'HORAS') {
          valorPorHora = parseFloat(String(proposal.valorPorHora || 0));
        }
      } else if (timeEntry.projectId) {
        const project = await this.projectRepository.findOne({
          where: { id: timeEntry.projectId },
          relations: ['proposal'],
        });
        if (project?.proposalId) {
          proposal = await this.proposalRepository.findOne({
            where: { id: project.proposalId },
          });
          if (proposal && proposal.tipoContratacao === 'HORAS') {
            valorPorHora = parseFloat(String(proposal.valorPorHora || 0));
          }
        }
      }

      // Se não é faturável, apenas remover do array
      if (valorPorHora === 0) {
        const approvedEntries: string[] = JSON.parse(invoiceToUpdate.approvedTimeEntries || '[]');
        const updatedEntries = approvedEntries.filter(id => id !== entryId);
        invoiceToUpdate.approvedTimeEntries = updatedEntries.length > 0 ? JSON.stringify(updatedEntries) : null;
        await this.invoiceRepository.save(invoiceToUpdate);
        return;
      }

      // Calcular valor a subtrair
      const horas = parseFloat(String(timeEntry.horas || 0));
      const valorASubtrair = horas * valorPorHora;

      // Remover hora do array
      const approvedEntries: string[] = JSON.parse(invoiceToUpdate.approvedTimeEntries || '[]');
      const updatedEntries = approvedEntries.filter(id => id !== entryId);

      // Atualizar invoice
      const currentValue = parseFloat(String(invoiceToUpdate.grossValue || 0));
      invoiceToUpdate.grossValue = Math.max(0, currentValue - valorASubtrair);
      invoiceToUpdate.approvedTimeEntries = updatedEntries.length > 0 ? JSON.stringify(updatedEntries) : null;

      // Se não há mais horas aprovadas e o valor é 0, podemos remover a invoice
      if (updatedEntries.length === 0 && invoiceToUpdate.grossValue === 0 && invoiceToUpdate.status === 'PROVISIONADA') {
        await this.invoiceRepository.remove(invoiceToUpdate);
      } else {
        await this.invoiceRepository.save(invoiceToUpdate);
      }
    } catch (error) {
      console.error('Erro ao remover hora da invoice:', error);
      // Não lançar erro para não impedir a reprovação
    }
  }

  async findTaskById(taskId: string): Promise<ProjectTask | null> {
    return this.projectTaskRepository.findOne({ 
      where: { id: taskId },
      relations: ['project', 'project.proposal', 'proposal'],
    });
  }

  async approveTimeEntry(entryId: string, companyId?: string, motivoAprovacao?: string, valorPorHora?: number, criarInvoice: boolean = true, aprovadoPor?: string): Promise<{ timeEntry: TimeEntry; invoice?: Invoice }> {
    console.log('=== approveTimeEntry chamado ===');
    console.log('entryId:', entryId);
    console.log('companyId recebido:', companyId);
    console.log('motivoAprovacao:', motivoAprovacao);
    console.log('valorPorHora recebido:', valorPorHora, 'tipo:', typeof valorPorHora);
    console.log('criarInvoice:', criarInvoice);
    
    // Buscar a hora trabalhada
    const timeEntry = await this.timeEntryRepository.findOne({
      where: { id: entryId },
      relations: ['project', 'proposal', 'client', 'user', 'aprovador', 'reprovador'],
    });

    if (!timeEntry) {
      throw new BadRequestException('Hora trabalhada não encontrada');
    }
    
    // Se clientId não estiver salvo diretamente, tentar obter da relação client
    if (!timeEntry.clientId && timeEntry.client?.id) {
      timeEntry.clientId = timeEntry.client.id;
      // Atualizar no banco para manter consistência
      await this.timeEntryRepository.update({ id: entryId }, { clientId: timeEntry.client.id });
    }
    
    console.log('timeEntry encontrado:', {
      id: timeEntry.id,
      projectId: timeEntry.projectId,
      proposalId: timeEntry.proposalId,
      clientId: timeEntry.clientId,
      clientIdFromRelation: timeEntry.client?.id,
      isFaturavel: timeEntry.isFaturavel,
      valorPorHora: timeEntry.valorPorHora,
      status: timeEntry.status
    });

    // Se não tiver companyId, tentar obter do projeto, negociação ou cliente
    if (!companyId) {
      if (timeEntry.projectId) {
        const project = await this.projectRepository.findOne({
          where: { id: timeEntry.projectId },
          select: ['companyId'],
        });
        if (project?.companyId) {
          companyId = project.companyId;
        }
      }
      
      // Se ainda não tiver, tentar da negociação
      if (!companyId && timeEntry.proposalId) {
        const proposal = await this.proposalRepository.findOne({
          where: { id: timeEntry.proposalId },
          select: ['companyId'],
        });
        if (proposal?.companyId) {
          companyId = proposal.companyId;
        }
      }
      
      // Se ainda não tiver, tentar do cliente
      if (!companyId && timeEntry.clientId) {
        const client = await this.clientRepository.findOne({
          where: { id: timeEntry.clientId },
          select: ['companyId'],
        });
        if (client?.companyId) {
          companyId = client.companyId;
        }
      }
    }

    if (!companyId) {
      throw new BadRequestException('Não foi possível determinar a empresa. Verifique se a hora trabalhada está vinculada a um projeto, negociação ou cliente.');
    }

    // Verificar se já está aprovada
    if (timeEntry.status === 'APROVADA') {
      throw new BadRequestException('Esta hora trabalhada já está aprovada');
    }

    // Determinar se é faturável
    // Primeiro verificar se a hora tem isFaturavel marcado explicitamente
    let isFaturavel = timeEntry.isFaturavel || false;
    let proposal: Proposal | null = null;
    let clientId: string | null = null;
    let valorPorHoraCalculado = 0;

    // Se valorPorHora foi fornecido no request, usar esse valor e salvar na hora
    if (valorPorHora && valorPorHora > 0) {
      valorPorHoraCalculado = valorPorHora;
      // Salvar o valorPorHora na hora trabalhada
      await this.timeEntryRepository.update({ id: entryId }, { valorPorHora: valorPorHora });
    }

    // Verificar se tem proposalId direto
    if (timeEntry.proposalId) {
      proposal = await this.proposalRepository.findOne({
        where: { id: timeEntry.proposalId },
      });
      if (proposal && proposal.tipoContratacao === 'HORAS') {
        isFaturavel = true;
        // Só usar valor da proposal se não foi fornecido no request
        if (!valorPorHoraCalculado) {
          valorPorHoraCalculado = parseFloat(String(proposal.valorPorHora || 0));
        }
        clientId = proposal.clientId;
      }
    }

    // Se não tem proposal direto, verificar via projeto
    if (!isFaturavel && timeEntry.projectId) {
      const project = await this.projectRepository.findOne({
        where: { id: timeEntry.projectId },
        relations: ['proposal'],
      });
      if (project?.proposalId) {
        proposal = await this.proposalRepository.findOne({
          where: { id: project.proposalId },
        });
        if (proposal && proposal.tipoContratacao === 'HORAS') {
          isFaturavel = true;
          // Só usar valor da proposal se não foi fornecido no request
          if (!valorPorHoraCalculado) {
            valorPorHoraCalculado = parseFloat(String(proposal.valorPorHora || 0));
          }
          clientId = proposal.clientId || project.clientId;
        }
      } else if (project?.clientId) {
        clientId = project.clientId;
      }
    }

    // Se ainda não tem cliente, usar o clientId direto da hora ou da relação client
    if (!clientId) {
      if (timeEntry.clientId) {
        clientId = timeEntry.clientId;
      } else if (timeEntry.client?.id) {
        clientId = timeEntry.client.id;
        // Atualizar no banco para manter consistência
        await this.timeEntryRepository.update({ id: entryId }, { clientId: timeEntry.client.id });
      }
    }

    // Se a hora tem isFaturavel marcado explicitamente (vinculada apenas a cliente), considerar faturável
    if (timeEntry.isFaturavel && !isFaturavel) {
      isFaturavel = true;
      // Se está vinculada apenas a cliente, garantir que temos o clientId
      if (!clientId) {
        if (timeEntry.clientId) {
          clientId = timeEntry.clientId;
        } else if (timeEntry.client?.id) {
          clientId = timeEntry.client.id;
          // Atualizar no banco para manter consistência
          await this.timeEntryRepository.update({ id: entryId }, { clientId: timeEntry.client.id });
        }
      }
    }

    // Se a hora tem isFaturavel mas não tem valorPorHora ainda, usar o fornecido no request ou o salvo
    if (isFaturavel && !valorPorHoraCalculado) {
      if (timeEntry.valorPorHora) {
        valorPorHoraCalculado = parseFloat(String(timeEntry.valorPorHora));
      }
    }
    
    console.log('Após determinar faturável:', {
      isFaturavel,
      clientId,
      valorPorHoraCalculado,
      criarInvoice
    });

    // Atualizar status da hora para APROVADA e motivo se fornecido
    const updateData: any = { 
      status: 'APROVADA',
      aprovadoEm: new Date(),
      faturamentoDesprezado: isFaturavel && !criarInvoice // Se é faturável mas não deve criar invoice, marcar como desprezado
    };
    if (motivoAprovacao) {
      updateData.motivoAprovacao = motivoAprovacao;
    }
    if (aprovadoPor) {
      updateData.aprovadoPor = aprovadoPor;
    }
    await this.timeEntryRepository.update({ id: entryId }, updateData);

    // Se não é faturável ou se não deve criar invoice, apenas retornar
    if (!isFaturavel || !criarInvoice) {
      return { timeEntry: await this.timeEntryRepository.findOne({ where: { id: entryId } }) };
    }

    // Se é faturável e deve criar invoice, criar ou atualizar invoice
    if (!clientId) {
      console.error('ERRO: clientId não encontrado para hora faturável', {
        timeEntryId: timeEntry.id,
        timeEntryClientId: timeEntry.clientId,
        clientRelationId: timeEntry.client?.id,
        hasClientRelation: !!timeEntry.client,
        isFaturavel: isFaturavel,
        criarInvoice: criarInvoice
      });
      throw new BadRequestException('Não foi possível determinar o cliente para criar a conta a receber. A hora trabalhada precisa estar vinculada a um cliente. Por favor, edite a hora trabalhada e vincule-a a um cliente antes de aprovar.');
    }

    if (!valorPorHoraCalculado || valorPorHoraCalculado <= 0) {
      console.error('ERRO: valorPorHora não informado ou inválido', {
        valorPorHoraCalculado,
        valorPorHoraRecebido: valorPorHora,
        valorPorHoraSalvo: timeEntry.valorPorHora
      });
      throw new BadRequestException('Valor por hora não informado ou inválido. É necessário informar o valor por hora para criar a conta a receber.');
    }

    // Calcular valor
    const horas = parseFloat(String(timeEntry.horas || 0));
    const valor = horas * valorPorHoraCalculado;

    // Buscar invoice provisionada do mesmo cliente para agrupar
    let invoice = await this.invoiceRepository.findOne({
      where: {
        companyId,
        clientId,
        status: 'PROVISIONADA',
        origem: 'TIMESHEET',
        proposalId: proposal?.id || null,
      },
      order: { createdAt: 'DESC' },
    });

    // Parse approved_time_entries
    let approvedEntries: string[] = [];
    if (invoice?.approvedTimeEntries) {
      try {
        approvedEntries = JSON.parse(invoice.approvedTimeEntries);
      } catch (e) {
        approvedEntries = [];
      }
    }

    // Adicionar esta hora aos aprovados
    approvedEntries.push(entryId);

    // Calcular datas
    let emissionDate = new Date();
    let dueDate = new Date();
    
    if (proposal) {
      // Se tem negociação, usar datas da negociação
      if (proposal.dataFaturamento) {
        emissionDate = new Date(proposal.dataFaturamento);
      }
      if (proposal.dataVencimento) {
        dueDate = new Date(proposal.dataVencimento);
      } else if (proposal.vencimento) {
        dueDate = new Date(proposal.vencimento);
      }
    }

    if (invoice) {
      // Atualizar invoice existente
      const currentValue = parseFloat(String(invoice.grossValue || 0));
      invoice.grossValue = currentValue + valor;
      invoice.approvedTimeEntries = JSON.stringify(approvedEntries);
      // Atualizar datas se necessário (manter as mais antigas para agrupamento)
      if (proposal && proposal.dataFaturamento) {
        const proposalEmissionDate = new Date(proposal.dataFaturamento);
        if (proposalEmissionDate < new Date(invoice.emissionDate)) {
          invoice.emissionDate = proposalEmissionDate;
        }
      }
      if (proposal && (proposal.dataVencimento || proposal.vencimento)) {
        const proposalDueDate = new Date(proposal.dataVencimento || proposal.vencimento);
        if (proposalDueDate < new Date(invoice.dueDate)) {
          invoice.dueDate = proposalDueDate;
        }
      }
      await this.invoiceRepository.save(invoice);
    } else {
      // Criar nova invoice
      const invoiceNumber = `TS-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Buscar classificação de honorários
      let chartOfAccountsId: string | null = null;
      if (proposal?.serviceType) {
        const classificacao = await this.chartOfAccountsRepository.findOne({
          where: {
            companyId,
            type: 'RECEITA',
          },
        });
        // Tentar encontrar classificação que contenha o tipo de serviço
        if (classificacao) {
          const allClassifications = await this.chartOfAccountsRepository.find({
            where: {
              companyId,
              type: 'RECEITA',
            },
          });
          const serviceTypeNames: Record<string, string> = {
            'ANALISE_DADOS': 'Análise de Dados',
            'ASSINATURAS': 'Assinaturas',
            'AUTOMACOES': 'Automações',
            'CONSULTORIA': 'Consultoria',
            'DESENVOLVIMENTOS': 'Desenvolvimentos',
            'MANUTENCOES': 'Manutenções',
            'MIGRACAO_DADOS': 'Migração de Dados',
            'TREINAMENTO': 'Treinamento',
            'TREINAMENTOS': 'Treinamento',
            'CONTRATO_FIXO': 'Contrato Fixo',
          };
          const nomeTipoServico = serviceTypeNames[proposal.serviceType] || proposal.serviceType;
          const found = allClassifications.find(c => 
            c.name.toLowerCase().includes('honorários') && 
            c.name.toLowerCase().includes(nomeTipoServico.toLowerCase())
          );
          if (found) {
            chartOfAccountsId = found.id;
          }
        }
      }

      invoice = this.invoiceRepository.create({
        companyId,
        clientId,
        proposalId: proposal?.id || null,
        chartOfAccountsId,
        invoiceNumber,
        emissionDate,
        dueDate,
        grossValue: valor,
        status: 'PROVISIONADA',
        origem: 'TIMESHEET',
        approvedTimeEntries: JSON.stringify(approvedEntries),
      });
      invoice = await this.invoiceRepository.save(invoice);
    }

    return {
      timeEntry: await this.timeEntryRepository.findOne({ where: { id: entryId } }),
      invoice,
    };
  }

  async findTaskComments(taskId: string): Promise<TaskComment[]> {
    return this.taskCommentRepository.find({
      where: { taskId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async createTaskComment(taskId: string, userId: string, texto: string): Promise<TaskComment> {
    try {
      // Verificar se a tarefa existe
      const task = await this.projectTaskRepository.findOne({ where: { id: taskId } });
      if (!task) {
        throw new Error('Tarefa não encontrada');
      }

      // Verificar se o usuário existe
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const comment = this.taskCommentRepository.create({
        taskId,
        userId,
        texto: texto.trim(),
      });

      const saved = await this.taskCommentRepository.save(comment);
      const result = await this.taskCommentRepository.findOne({
        where: { id: saved.id },
        relations: ['user'],
      });
      
      if (!result) {
        throw new Error('Erro ao recuperar comentário salvo');
      }
      
      return result;
    } catch (error: any) {
      console.error('Erro em createTaskComment:', error);
      console.error('taskId:', taskId);
      console.error('userId:', userId);
      console.error('texto:', texto);
      throw error;
    }
  }

  async deleteTaskComment(commentId: string): Promise<void> {
    await this.taskCommentRepository.delete(commentId);
  }
}

