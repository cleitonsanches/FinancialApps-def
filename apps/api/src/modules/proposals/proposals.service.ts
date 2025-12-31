import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal } from '../../database/entities/proposal.entity';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { ProjectTemplate } from '../../database/entities/project-template.entity';
import { ProjectTemplateTask } from '../../database/entities/project-template-task.entity';
import { Phase } from '../../database/entities/phase.entity';
import { Client } from '../../database/entities/client.entity';
import { ServiceType } from '../../database/entities/service-type.entity';

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
    @InjectRepository(Phase)
    private phaseRepository: Repository<Phase>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ServiceType)
    private serviceTypeRepository: Repository<ServiceType>,
  ) {}

  async findAll(companyId?: string, status?: string): Promise<Proposal[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (status) {
      where.status = status;
    }
    const proposals = await this.proposalRepository.find({ 
      where,
      relations: ['client', 'user'],
      order: { createdAt: 'DESC' },
    });
    
    // Converter parcelas de JSON string para array em cada proposta
    return proposals.map(proposal => {
      if (proposal.parcelas) {
        try {
          (proposal as any).parcelas = JSON.parse(proposal.parcelas);
        } catch (e) {
          // Se não for JSON válido, manter como está
        }
      }
      return proposal;
    });
  }

  async findOne(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({ 
      where: { id },
      relations: ['client', 'user'],
    });
    
    console.log('ProposalsService.findOne - Proposta encontrada:', proposal?.id);
    console.log('ProposalsService.findOne - Parcelas (raw):', proposal?.parcelas);
    console.log('ProposalsService.findOne - Tipo de parcelas:', typeof proposal?.parcelas);
    
    // Converter parcelas de JSON string para array
    if (proposal && proposal.parcelas) {
      try {
        (proposal as any).parcelas = JSON.parse(proposal.parcelas);
        console.log('ProposalsService.findOne - Parcelas parseadas:', (proposal as any).parcelas);
        console.log('ProposalsService.findOne - Quantidade de parcelas:', Array.isArray((proposal as any).parcelas) ? (proposal as any).parcelas.length : 'não é array');
      } catch (e) {
        console.error('ProposalsService.findOne - Erro ao fazer parse das parcelas:', e);
        // Se não for JSON válido, manter como está
      }
    }
    
    return proposal;
  }

  async create(proposalData: Partial<Proposal>): Promise<Proposal> {
    // Garantir que status seja RASCUNHO ao criar
    proposalData.status = 'RASCUNHO';
    
    // Gerar número sequencial no formato: sequencial/ano
    if (!proposalData.numero) {
      const currentYear = new Date().getFullYear();
      const count = await this.proposalRepository.count({
        where: { companyId: proposalData.companyId },
      });
      const sequencial = count + 1;
      proposalData.numero = `${sequencial}/${currentYear}`;
    }
    
    // Converter parcelas para JSON string se existir
    if ((proposalData as any).parcelas && Array.isArray((proposalData as any).parcelas)) {
      console.log('ProposalsService.create - Parcelas recebidas:', (proposalData as any).parcelas);
      (proposalData as any).parcelas = JSON.stringify((proposalData as any).parcelas);
      console.log('ProposalsService.create - Parcelas convertidas para JSON:', (proposalData as any).parcelas);
    }
    
    const proposal = this.proposalRepository.create(proposalData);
    const saved = await this.proposalRepository.save(proposal);
    
    console.log('ProposalsService.create - Proposta salva:', saved);
    console.log('ProposalsService.create - Parcelas salvas (string):', saved.parcelas);
    
    // Converter parcelas de volta para array ao retornar
    if (saved.parcelas) {
      try {
        (saved as any).parcelas = JSON.parse(saved.parcelas);
        console.log('ProposalsService.create - Parcelas parseadas de volta:', (saved as any).parcelas);
      } catch (e) {
        console.error('ProposalsService.create - Erro ao fazer parse das parcelas:', e);
        // Se não for JSON válido, manter como está
      }
    }
    
    return saved;
  }

  async update(id: string, proposalData: any): Promise<Proposal> {
    // Mapear campos do frontend para a entidade
    const updateData: Partial<Proposal> = {}
    
    // Campos básicos
    if (proposalData.clientId !== undefined) updateData.clientId = proposalData.clientId
    if (proposalData.companyId !== undefined) updateData.companyId = proposalData.companyId
    if (proposalData.title !== undefined) updateData.title = proposalData.title
    if (proposalData.status !== undefined) updateData.status = proposalData.status
    if (proposalData.serviceType !== undefined) updateData.serviceType = proposalData.serviceType
    
    // Campos de valores
    if (proposalData.valorTotal !== undefined) updateData.valorTotal = proposalData.valorTotal
    if (proposalData.valorProposta !== undefined) updateData.valorProposta = proposalData.valorProposta
    if (proposalData.valorPorHora !== undefined) updateData.valorPorHora = proposalData.valorPorHora
    
    // Campos de contratação e faturamento
    if (proposalData.tipoContratacao !== undefined) updateData.tipoContratacao = proposalData.tipoContratacao
    if (proposalData.tipoFaturamento !== undefined) updateData.tipoFaturamento = proposalData.tipoFaturamento
    if (proposalData.formaFaturamento !== undefined) updateData.formaFaturamento = proposalData.formaFaturamento
    if (proposalData.horasEstimadas !== undefined) updateData.horasEstimadas = proposalData.horasEstimadas
    
    // Campos de datas - mapear 'inicio' para 'dataInicio' (não incluir 'inicio' diretamente)
    if (proposalData.inicio !== undefined) {
      updateData.dataInicio = proposalData.inicio
    } else if (proposalData.dataInicio !== undefined) {
      updateData.dataInicio = proposalData.dataInicio
    }
    if (proposalData.previsaoConclusao !== undefined) updateData.previsaoConclusao = proposalData.previsaoConclusao
    if (proposalData.inicioFaturamento !== undefined) updateData.inicioFaturamento = proposalData.inicioFaturamento
    if (proposalData.vencimento !== undefined) updateData.vencimento = proposalData.vencimento
    
    // Campos específicos para Migração de Dados
    if (proposalData.sistemaOrigem !== undefined) updateData.sistemaOrigem = proposalData.sistemaOrigem
    if (proposalData.sistemaDestino !== undefined) updateData.sistemaDestino = proposalData.sistemaDestino
    if (proposalData.dataEntregaHomologacao !== undefined) updateData.dataEntregaHomologacao = proposalData.dataEntregaHomologacao
    if (proposalData.dataEntregaProducao !== undefined) updateData.dataEntregaProducao = proposalData.dataEntregaProducao
    if (proposalData.dataInicioTrabalho !== undefined) updateData.dataInicioTrabalho = proposalData.dataInicioTrabalho
    if (proposalData.dataFaturamento !== undefined) updateData.dataFaturamento = proposalData.dataFaturamento
    if (proposalData.dataVencimento !== undefined) updateData.dataVencimento = proposalData.dataVencimento
    
    // Campos de data de status (geralmente gerenciados automaticamente, mas podem ser passados manualmente)
    if (proposalData.dataEnvio !== undefined) updateData.dataEnvio = proposalData.dataEnvio
    if (proposalData.dataReEnvio !== undefined) updateData.dataReEnvio = proposalData.dataReEnvio
    if (proposalData.dataRevisao !== undefined) updateData.dataRevisao = proposalData.dataRevisao
    if (proposalData.dataFechamento !== undefined) updateData.dataFechamento = proposalData.dataFechamento
    if (proposalData.dataDeclinio !== undefined) updateData.dataDeclinio = proposalData.dataDeclinio
    if (proposalData.dataCancelamento !== undefined) updateData.dataCancelamento = proposalData.dataCancelamento
    
    // Campos de motivo
    if (proposalData.motivoCancelamento !== undefined) updateData.motivoCancelamento = proposalData.motivoCancelamento
    if (proposalData.motivoDeclinio !== undefined) updateData.motivoDeclinio = proposalData.motivoDeclinio
    if (proposalData.dataDeclinio !== undefined) updateData.dataDeclinio = proposalData.dataDeclinio
    if (proposalData.dataCancelamento !== undefined) updateData.dataCancelamento = proposalData.dataCancelamento
    
    // Campos de validade
    if (proposalData.dataValidade !== undefined) updateData.dataValidade = proposalData.dataValidade
    if (proposalData.dataLimiteAceite !== undefined) updateData.dataLimiteAceite = proposalData.dataLimiteAceite
    
    // Converter parcelas para JSON string se existir
    if ((proposalData as any).parcelas && Array.isArray((proposalData as any).parcelas)) {
      console.log('ProposalsService.update - Parcelas recebidas:', (proposalData as any).parcelas);
      updateData.parcelas = JSON.stringify((proposalData as any).parcelas);
      console.log('ProposalsService.update - Parcelas convertidas para JSON:', updateData.parcelas);
    } else if ((proposalData as any).parcelas !== undefined) {
      updateData.parcelas = (proposalData as any).parcelas;
      console.log('ProposalsService.update - Parcelas (não array):', updateData.parcelas);
    }
    
    const existingProposal = await this.findOne(id);
    if (!existingProposal) {
      throw new Error('Proposta não encontrada');
    }

    // Lógica para lidar com mudanças de status
    if (updateData.status && updateData.status !== existingProposal.status) {
      const today = new Date()
      
      // Registrar data da mudança de status
      switch (updateData.status) {
        case 'ENVIADA':
          updateData.dataEnvio = today
          break
        case 'RE_ENVIADA':
          updateData.dataReEnvio = today
          break
        case 'REVISADA':
          updateData.dataRevisao = today
          break
        case 'FECHADA':
          updateData.dataFechamento = today
          break
        case 'DECLINADA':
          updateData.dataDeclinio = today
          break
        case 'CANCELADA':
          updateData.dataCancelamento = today
          break
      }

      const linkedProjects = await this.projectRepository.find({
        where: { proposalId: id },
        relations: ['tasks'],
      })

      // Status ENVIADA, RE_ENVIADA e REVISADA não realizam ações, apenas registram a data
      // (já registrado acima)

      // Se status mudou de FECHADA para outro (RASCUNHO, ENVIADA, etc.), deletar projetos e tarefas
      if (existingProposal.status === 'FECHADA' && 
          ['RASCUNHO', 'ENVIADA', 'RE_ENVIADA', 'REVISADA'].includes(updateData.status)) {
        for (const project of linkedProjects) {
          if (project.tasks) {
            await this.projectTaskRepository.delete({ projectId: project.id });
          }
          await this.projectRepository.delete(project.id);
        }
      }

      // Se status mudou para DECLINADA, deletar projetos e tarefas
      if (updateData.status === 'DECLINADA') {
        for (const project of linkedProjects) {
          if (project.tasks) {
            await this.projectTaskRepository.delete({ projectId: project.id });
          }
          await this.projectRepository.delete(project.id);
        }
      }

      // Se status mudou para CANCELADA, alterar status dos projetos e tarefas
      if (updateData.status === 'CANCELADA') {
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

    console.log('ProposalsService.update - Dados para atualizar:', updateData);
    await this.proposalRepository.update(id, updateData);
    const updated = await this.findOne(id);
    console.log('ProposalsService.update - Proposta atualizada:', updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.proposalRepository.delete(id);
  }

  async createProjectFromTemplate(proposalId: string, templateId: string, startDate: Date): Promise<any> {
    const proposal = await this.findOne(proposalId);
    if (!proposal) {
      throw new Error('Proposta não encontrada');
    }

    // Carregar template com fases e tarefas (tasks para compatibilidade com templates antigos)
    const template = await this.projectTemplateRepository.findOne({
      where: { id: templateId },
      relations: ['phases', 'phases.tasks', 'tasks'],
    });

    if (!template) {
      throw new Error('Template não encontrado');
    }

    // Buscar cliente para gerar nome do projeto
    let client = null;
    if (proposal.clientId) {
      client = await this.clientRepository.findOne({ where: { id: proposal.clientId } });
    }

    // Buscar tipo de serviço para obter nome legível
    let serviceTypeName = template.serviceType || '';
    if (template.serviceType) {
      const serviceType = await this.serviceTypeRepository.findOne({
        where: { code: template.serviceType, companyId: proposal.companyId },
      });
      if (serviceType) {
        serviceTypeName = serviceType.name;
      } else {
        // Fallback para mapeamento estático
        const labels: Record<string, string> = {
          AUTOMACOES: 'Automações',
          CONSULTORIA: 'Consultoria',
          TREINAMENTO: 'Treinamento',
          MIGRACAO_DADOS: 'Migração de Dados',
          ANALISE_DADOS: 'Análise de Dados',
          ASSINATURAS: 'Assinaturas',
          MANUTENCOES: 'Manutenções',
          DESENVOLVIMENTOS: 'Desenvolvimentos',
          CONTRATO_FIXO: 'Contrato Fixo',
        };
        serviceTypeName = labels[template.serviceType] || template.serviceType;
      }
    }

    // Gerar nome do projeto: NOME_CLIENTE_CAIXA_ALTA + "-" + nome_serviço
    const clientName = client?.razaoSocial || client?.name || client?.nome || 'CLIENTE';
    const clientNameUpper = clientName.toUpperCase();
    const projectName = `${clientNameUpper}-${serviceTypeName}`;

    // Criar projeto
    const project = this.projectRepository.create({
      companyId: proposal.companyId,
      clientId: proposal.clientId,
      proposalId: proposal.id,
      templateId: template.id,
      name: projectName,
      description: template.description,
      serviceType: template.serviceType,
      dataInicio: startDate,
      status: 'PENDENTE',
    });

    const savedProject = await this.projectRepository.save(project);

    const tasks: ProjectTask[] = [];
    const taskMap = new Map<string, ProjectTask>();
    const phases: Phase[] = [];
    const phaseMap = new Map<string, Phase>();

    // Se o template tiver fases, criar fases primeiro
    if (template.phases && template.phases.length > 0) {
      // Ordenar fases por ordem
      const sortedPhases = [...template.phases].sort((a, b) => a.ordem - b.ordem);

      for (const templatePhase of sortedPhases) {
        const phase = this.phaseRepository.create({
          projectId: savedProject.id,
          name: templatePhase.name,
          description: templatePhase.description,
          ordem: templatePhase.ordem,
          status: 'PENDENTE',
        });

        const savedPhase = await this.phaseRepository.save(phase);
        phases.push(savedPhase);
        phaseMap.set(templatePhase.id, savedPhase);

        // Criar tarefas dentro da fase
        if (templatePhase.tasks && templatePhase.tasks.length > 0) {
          const sortedPhaseTasks = [...templatePhase.tasks].sort((a, b) => a.ordem - b.ordem);

          for (const templateTask of sortedPhaseTasks) {
            let taskStartDate: Date;

            if (templateTask.diasAposInicioProjeto !== null && templateTask.diasAposInicioProjeto !== undefined) {
              taskStartDate = new Date(startDate);
              taskStartDate.setDate(taskStartDate.getDate() + templateTask.diasAposInicioProjeto);
            } else if (templateTask.tarefaAnteriorId) {
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

            const exigirLancamentoHoras = proposal.tipoContratacao === 'HORAS';
            
            const task = this.projectTaskRepository.create({
              projectId: savedProject.id,
              phaseId: savedPhase.id,
              name: templateTask.name,
              description: templateTask.description,
              dataInicio: taskStartDate,
              dataConclusao: taskEndDate,
              status: 'PENDENTE',
              ordem: templateTask.ordem,
              exigirLancamentoHoras: exigirLancamentoHoras,
            });

            const savedTask = await this.projectTaskRepository.save(task);
            tasks.push(savedTask);
            taskMap.set(templateTask.id, savedTask);
          }
        }
      }
    } else if (template.tasks && template.tasks.length > 0) {
      // Compatibilidade com templates antigos (sem fases)
      const sortedTemplateTasks = [...template.tasks].sort((a, b) => a.ordem - b.ordem);

      for (const templateTask of sortedTemplateTasks) {
        let taskStartDate: Date;

        if (templateTask.diasAposInicioProjeto !== null && templateTask.diasAposInicioProjeto !== undefined) {
          taskStartDate = new Date(startDate);
          taskStartDate.setDate(taskStartDate.getDate() + templateTask.diasAposInicioProjeto);
        } else if (templateTask.tarefaAnteriorId) {
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

        const exigirLancamentoHoras = proposal.tipoContratacao === 'HORAS';
        
        const task = this.projectTaskRepository.create({
          projectId: savedProject.id,
          name: templateTask.name,
          description: templateTask.description,
          dataInicio: taskStartDate,
          dataConclusao: taskEndDate,
          status: 'PENDENTE',
          ordem: templateTask.ordem,
          exigirLancamentoHoras: exigirLancamentoHoras,
        });

        const savedTask = await this.projectTaskRepository.save(task);
        tasks.push(savedTask);
        taskMap.set(templateTask.id, savedTask);
      }
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
      phases: phases.map(phase => ({
        ...phase,
        dataInicio: phase.dataInicio ? phase.dataInicio.toISOString().split('T')[0] : null,
        dataFim: phase.dataFim ? phase.dataFim.toISOString().split('T')[0] : null,
      })),
      tasks: tasks.map(task => ({
        ...task,
        dataInicio: task.dataInicio ? task.dataInicio.toISOString().split('T')[0] : null,
        dataConclusao: task.dataConclusao ? task.dataConclusao.toISOString().split('T')[0] : null,
      })),
    };
  }

  /**
   * Calcula a data de vencimento (12 meses a partir da data de início)
   * @param dataInicio Data de início
   * @returns Data de vencimento (12 meses depois)
   */
  calcularVencimento12Meses(dataInicio: Date | string): Date {
    const inicio = typeof dataInicio === 'string' ? new Date(dataInicio) : dataInicio;
    const vencimento = new Date(inicio);
    vencimento.setMonth(vencimento.getMonth() + 12);
    return vencimento;
  }

  /**
   * Cria uma proposta de manutenção vinculada a uma proposta principal
   * @param propostaPrincipalId ID da proposta principal
   * @param dadosManutencao Dados específicos da manutenção
   * @returns Proposta de manutenção criada
   */
  async criarPropostaManutencaoVinculada(
    propostaPrincipalId: string,
    dadosManutencao: {
      valorMensalManutencao?: number;
      dataInicioManutencao?: Date | string;
      descricaoManutencao?: string;
      vencimentoManutencao?: Date | string;
    }
  ): Promise<Proposal> {
    const propostaPrincipal = await this.findOne(propostaPrincipalId);
    
    if (!propostaPrincipal) {
      throw new NotFoundException(`Proposta principal com ID ${propostaPrincipalId} não encontrada`);
    }

    // Calcular valor sugerido (pode ser baseado em percentual da proposta principal)
    const valorMensal = dadosManutencao.valorMensalManutencao || 
                        (propostaPrincipal.valorProposta ? propostaPrincipal.valorProposta * 0.1 : 0);

    // Calcular data de início sugerida (pode ser baseada na data de conclusão da proposta principal)
    const dataInicio = dadosManutencao.dataInicioManutencao 
      ? (typeof dadosManutencao.dataInicioManutencao === 'string' 
          ? new Date(dadosManutencao.dataInicioManutencao) 
          : dadosManutencao.dataInicioManutencao)
      : (propostaPrincipal.previsaoConclusao || new Date());

    // Calcular vencimento (12 meses após início)
    const vencimento = dadosManutencao.vencimentoManutencao
      ? (typeof dadosManutencao.vencimentoManutencao === 'string'
          ? new Date(dadosManutencao.vencimentoManutencao)
          : dadosManutencao.vencimentoManutencao)
      : this.calcularVencimento12Meses(dataInicio);

    // Criar proposta de manutenção usando o método create para gerar número automaticamente
    const propostaManutencaoData: Partial<Proposal> = {
      companyId: propostaPrincipal.companyId,
      clientId: propostaPrincipal.clientId,
      userId: propostaPrincipal.userId,
      serviceType: 'MANUTENCOES',
      status: 'RASCUNHO',
      title: `Manutenção - ${propostaPrincipal.title}`,
      valorMensalManutencao: valorMensal,
      dataInicioManutencao: dataInicio,
      vencimentoManutencao: vencimento,
      descricaoManutencao: dadosManutencao.descricaoManutencao || 
                          `Manutenção vinculada à proposta ${propostaPrincipal.numero}`,
      tipoContratacao: 'FIXO_RECORRENTE',
      formaFaturamento: 'PARCELADO',
      valorProposta: valorMensal,
    };

    // Gerar número sequencial no formato: sequencial/ano
    const currentYear = new Date().getFullYear();
    const count = await this.proposalRepository.count({
      where: { companyId: propostaPrincipal.companyId },
    });
    const sequencial = count + 1;
    propostaManutencaoData.numero = `${sequencial}/${currentYear}`;

    const propostaManutencaoSalva = await this.create(propostaManutencaoData);

    // Atualizar proposta principal para indicar que tem manutenção vinculada
    await this.proposalRepository.update(propostaPrincipalId, {
      temManutencaoVinculada: true,
      propostaManutencaoId: propostaManutencaoSalva.id,
    });

    return propostaManutencaoSalva;
  }

  /**
   * Calcula o valor sugerido para manutenção baseado na proposta principal
   * @param propostaPrincipal Proposta principal
   * @returns Valor mensal sugerido
   */
  calcularValorSugeridoManutencao(propostaPrincipal: Proposal): number {
    // Sugestão: 10% do valor da proposta principal
    if (propostaPrincipal.valorProposta) {
      return propostaPrincipal.valorProposta * 0.1;
    }
    return 0;
  }
}

