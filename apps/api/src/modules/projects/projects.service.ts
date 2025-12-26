import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { Proposal } from '../../database/entities/proposal.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { ChartOfAccounts } from '../../database/entities/chart-of-accounts.entity';

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
        relations: ['project', 'project.client', 'project.proposal', 'proposal', 'usuarioExecutor', 'usuarioResponsavel'],
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
    
    // Se não foi especificado, verificar se deve exigir lançamento de horas
    if (taskData.exigirLancamentoHoras === undefined) {
      // Se está vinculado a uma negociação, verificar se é "Por Horas"
      if (taskData.proposalId) {
        const proposal = await this.proposalRepository.findOne({
          where: { id: taskData.proposalId },
          select: ['tipoContratacao']
        });
        if (proposal && proposal.tipoContratacao === 'HORAS') {
          taskData.exigirLancamentoHoras = true;
        }
      }
      // Se está vinculado a um projeto, verificar se o projeto está vinculado a uma negociação "Por Horas"
      else if (taskData.projectId) {
        const project = await this.projectRepository.findOne({
          where: { id: taskData.projectId },
          relations: ['proposal'],
          select: ['id', 'proposal']
        });
        if (project?.proposal?.tipoContratacao === 'HORAS') {
          taskData.exigirLancamentoHoras = true;
        }
      }
    }
    
    const task = this.projectTaskRepository.create({
      ...taskData,
      status: taskData.status || 'PENDENTE',
    });
    return this.projectTaskRepository.save(task);
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
    
    // Mapear dataFimPrevista para dataConclusao se necessário
    const updateData: any = { ...taskData };
    if ('dataFimPrevista' in updateData) {
      updateData.dataConclusao = updateData.dataFimPrevista;
      delete updateData.dataFimPrevista;
    }
    
    // Se projectId for null/undefined, usar apenas taskId no update
    if (projectId) {
      await this.projectTaskRepository.update({ id: taskId, projectId }, updateData);
    } else {
      await this.projectTaskRepository.update({ id: taskId }, updateData);
    }
    
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
    
    // Se houver proposalId e a negociação for do tipo "Por hora", criar conta a receber
    if (saved.proposalId) {
      try {
        const proposal = await this.proposalRepository.findOne({ 
          where: { id: saved.proposalId },
          select: ['tipoContratacao', 'status', 'valorPorHora', 'clientId', 'companyId', 'serviceType']
        });
        
        if (proposal && proposal.tipoContratacao === 'HORAS' && proposal.status === 'FECHADA') {
          // Para negociações "Por hora", sempre criar conta a receber quando houver horas lançadas
          // Obter ou criar classificação de honorários
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
              };
              
            const nomeTipoServico = serviceTypeNames[proposal.serviceType] || proposal.serviceType;
            const nomeClassificacao = `Honorários - ${nomeTipoServico}`;
            
            let classificacao = await this.chartOfAccountsRepository.findOne({
              where: {
                companyId: proposal.companyId,
                name: nomeClassificacao,
                type: 'RECEITA'
              }
            });
            
            if (!classificacao) {
              const code = `HON-${proposal.serviceType.substring(0, 3).toUpperCase()}`;
              classificacao = this.chartOfAccountsRepository.create({
                companyId: proposal.companyId,
                name: nomeClassificacao,
                type: 'RECEITA',
                status: 'ATIVA',
                code: code
              });
              classificacao = await this.chartOfAccountsRepository.save(classificacao);
            }
            
            chartOfAccountsId = classificacao.id;
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
      relations: ['project', 'project.proposal', 'proposal'],
    });
  }
}

