import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Invoice, InvoiceTax } from '../../database/entities/invoice.entity';
import { Proposal } from '../../database/entities/proposal.entity';
import { ChartOfAccounts } from '../../database/entities/chart-of-accounts.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { InvoiceHistory } from '../../database/entities/invoice-history.entity';
import { Client } from '../../database/entities/client.entity';
import { AccountPayable } from '../../database/entities/account-payable.entity';
import { InvoiceAccountPayable } from '../../database/entities/invoice-account-payable.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceTax)
    private invoiceTaxRepository: Repository<InvoiceTax>,
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>,
    @InjectRepository(TimeEntry)
    private timeEntryRepository: Repository<TimeEntry>,
    @InjectRepository(InvoiceHistory)
    private invoiceHistoryRepository: Repository<InvoiceHistory>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(AccountPayable)
    private accountPayableRepository: Repository<AccountPayable>,
    @InjectRepository(InvoiceAccountPayable)
    private invoiceAccountPayableRepository: Repository<InvoiceAccountPayable>,
  ) {}

  async findAll(companyId?: string): Promise<Invoice[]> {
    if (companyId) {
      return this.invoiceRepository.find({ 
        where: { companyId },
        relations: ['client', 'proposal', 'chartOfAccounts', 'contaCorrente'],
      });
    }
    return this.invoiceRepository.find({ relations: ['client', 'proposal', 'chartOfAccounts', 'contaCorrente'] });
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ 
      where: { id },
      relations: ['client', 'proposal', 'taxes', 'chartOfAccounts', 'contaCorrente'],
    });
    // Log para debug
    if (invoice && invoice.origem === 'TIMESHEET') {
      console.log('Invoice TIMESHEET encontrada:', invoice.id);
      console.log('approvedTimeEntries:', invoice.approvedTimeEntries);
    }
    return invoice;
  }

  async getHistory(invoiceId: string): Promise<InvoiceHistory[]> {
    return this.invoiceHistoryRepository.find({
      where: { invoiceId },
      relations: ['changedByUser'],
      order: { changedAt: 'DESC' },
    });
  }

  private async recordHistory(
    invoiceId: string,
    action: string,
    changedBy?: string,
    fieldName?: string,
    oldValue?: string,
    newValue?: string,
    description?: string,
  ): Promise<void> {
    const history = this.invoiceHistoryRepository.create({
      invoiceId,
      action,
      changedBy,
      fieldName,
      oldValue,
      newValue,
      description,
    });
    await this.invoiceHistoryRepository.save(history);
  }

  async create(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(invoiceData);
    return this.invoiceRepository.save(invoice);
  }

  async update(id: string, invoiceData: Partial<Invoice>, userId?: string): Promise<Invoice> {
    // Buscar invoice atual para verificar se é TIMESHEET
    const existingInvoice = await this.invoiceRepository.findOne({ where: { id } });
    
    if (!existingInvoice) {
      throw new BadRequestException('Invoice não encontrada');
    }

    // Verificar se é cancelamento
    const isCancellation = invoiceData.status === 'CANCELADA' && existingInvoice.status !== 'CANCELADA';
    // Verificar se é recebimento
    const isRecebimento = invoiceData.status === 'RECEBIDA' && existingInvoice.status !== 'RECEBIDA';
    // Verificar se é faturamento (mudança para FATURADA)
    const isFaturamento = invoiceData.status === 'FATURADA' && existingInvoice.status !== 'FATURADA';
    
    // Registrar histórico de alterações
    const changes: Array<{ field: string; old: any; new: any }> = [];
    
    // Comparar campos alterados
    const fieldsToTrack = [
      'grossValue', 'emissionDate', 'dueDate', 'numeroNF', 'tipoEmissao',
      'desconto', 'acrescimo', 'chartOfAccountsId', 'status', 'dataRecebimento',
      'contaCorrenteId'
    ];
    
    for (const field of fieldsToTrack) {
      if (invoiceData[field] !== undefined && invoiceData[field] !== existingInvoice[field]) {
        const oldVal = existingInvoice[field];
        const newVal = invoiceData[field];
        changes.push({ field, old: oldVal, new: newVal });
      }
    }

    // Se for cancelamento, registrar ação especial
    if (isCancellation) {
      await this.recordHistory(
        id,
        'CANCEL',
        userId,
        undefined,
        undefined,
        undefined,
        'Conta a receber cancelada. É necessário cancelar a Nota Fiscal correspondente.',
      );
    } else if (isRecebimento) {
      // Registrar recebimento
      await this.recordHistory(
        id,
        'RECEIVE',
        userId,
        'status',
        existingInvoice.status,
        'RECEBIDA',
        `Conta a receber marcada como recebida${invoiceData.dataRecebimento ? ` em ${invoiceData.dataRecebimento}` : ''}`,
      );
      // Registrar outros campos alterados no recebimento (dataRecebimento, contaCorrenteId)
      for (const change of changes) {
        if (change.field !== 'status') {
          await this.recordHistory(
            id,
            'RECEIVE',
            userId,
            change.field,
            change.old ? String(change.old) : null,
            change.new ? String(change.new) : null,
          );
        }
      }
    } else if (changes.length > 0) {
      // Registrar cada alteração
      for (const change of changes) {
        await this.recordHistory(
          id,
          'EDIT',
          userId,
          change.field,
          change.old ? String(change.old) : null,
          change.new ? String(change.new) : null,
        );
      }
    }

    // Se é TIMESHEET e tem selectedTimeEntries, processar horas selecionadas
    if (existingInvoice.origem === 'TIMESHEET' && (invoiceData as any).selectedTimeEntries) {
      const selectedTimeEntries = (invoiceData as any).selectedTimeEntries as string[];
      const currentApprovedEntries = existingInvoice.approvedTimeEntries 
        ? JSON.parse(existingInvoice.approvedTimeEntries) 
        : [];
      
      // Se há horas desmarcadas, criar nova invoice para elas
      const deselectedEntries = currentApprovedEntries.filter((entryId: string) => 
        !selectedTimeEntries.includes(entryId)
      );
      
      if (deselectedEntries.length > 0 && existingInvoice.status === 'PROVISIONADA') {
        // Buscar as horas desmarcadas para calcular o valor
        const deselectedTimeEntries = await this.timeEntryRepository.find({
          where: { id: In(deselectedEntries) },
          relations: ['proposal', 'project', 'project.proposal'],
        });
        
        // Calcular valor total das horas desmarcadas
        let valorDesmarcadas = 0;
        for (const entry of deselectedTimeEntries) {
          let valorPorHora = 0;
          
          // Tentar obter valorPorHora da entry
          if (entry.valorPorHora) {
            valorPorHora = parseFloat(String(entry.valorPorHora));
          } else if (entry.proposal?.tipoContratacao === 'HORAS') {
            valorPorHora = parseFloat(String(entry.proposal.valorPorHora || 0));
          } else if (entry.project?.proposal?.tipoContratacao === 'HORAS') {
            valorPorHora = parseFloat(String(entry.project.proposal.valorPorHora || 0));
          }
          
          const horas = parseFloat(String(entry.horas || 0));
          valorDesmarcadas += horas * valorPorHora;
        }
        
        // Gerar número de invoice para as horas desmarcadas
        // Usar o invoiceNumber original com sufixo ou gerar novo se não houver
        let newInvoiceNumber: string;
        if (existingInvoice.invoiceNumber) {
          // Adicionar sufixo ao número original
          const timestamp = Date.now().toString().slice(-6);
          newInvoiceNumber = `${existingInvoice.invoiceNumber}-RES-${timestamp}`;
        } else {
          // Gerar novo número baseado no cliente e timestamp
          const clientPrefix = existingInvoice.clientId.substring(0, 4).toUpperCase();
          const timestamp = Date.now().toString().slice(-8);
          newInvoiceNumber = `TIMESHEET-${clientPrefix}-${timestamp}`;
        }
        
        // Criar nova invoice provisionada para as horas desmarcadas
        const newInvoiceData: Partial<Invoice> = {
          companyId: existingInvoice.companyId,
          clientId: existingInvoice.clientId,
          proposalId: existingInvoice.proposalId,
          invoiceNumber: newInvoiceNumber,
          origem: 'TIMESHEET',
          status: 'PROVISIONADA',
          approvedTimeEntries: JSON.stringify(deselectedEntries),
          chartOfAccountsId: existingInvoice.chartOfAccountsId,
          grossValue: valorDesmarcadas,
          emissionDate: existingInvoice.emissionDate || new Date(),
          dueDate: existingInvoice.dueDate || new Date(),
        };
        
        const newInvoice = this.invoiceRepository.create(newInvoiceData);
        await this.invoiceRepository.save(newInvoice);
        
        console.log(`Nova invoice criada para ${deselectedEntries.length} horas desmarcadas:`, newInvoice.id, 'Número:', newInvoiceNumber, 'Valor:', valorDesmarcadas);
      }
      
      // Buscar as horas selecionadas para recalcular o valor
      if (selectedTimeEntries.length > 0) {
        const selectedTimeEntriesData = await this.timeEntryRepository.find({
          where: { id: In(selectedTimeEntries) },
          relations: ['proposal', 'project', 'project.proposal'],
        });
        
        // Calcular valor total das horas selecionadas
        let valorSelecionadas = 0;
        for (const entry of selectedTimeEntriesData) {
          let valorPorHora = 0;
          
          // Tentar obter valorPorHora da entry
          if (entry.valorPorHora) {
            valorPorHora = parseFloat(String(entry.valorPorHora));
          } else if (entry.proposal?.tipoContratacao === 'HORAS') {
            valorPorHora = parseFloat(String(entry.proposal.valorPorHora || 0));
          } else if (entry.project?.proposal?.tipoContratacao === 'HORAS') {
            valorPorHora = parseFloat(String(entry.project.proposal.valorPorHora || 0));
          }
          
          const horas = parseFloat(String(entry.horas || 0));
          valorSelecionadas += horas * valorPorHora;
        }
        
        // Atualizar valor da invoice com o valor calculado das horas selecionadas
        // Só atualizar se não foi fornecido um valor manual
        if (!invoiceData.grossValue || invoiceData.grossValue === 0) {
          invoiceData.grossValue = valorSelecionadas;
        }
      }
      
      // Atualizar approvedTimeEntries com apenas as horas selecionadas
      invoiceData.approvedTimeEntries = selectedTimeEntries.length > 0 
        ? JSON.stringify(selectedTimeEntries) 
        : null;
    }
    
    // Extrair dataFaturamento antes de remover do payload (usar apenas para cálculo do SIMPLES)
    const dataFaturamento = (invoiceData as any).dataFaturamento;
    
    // Remover selectedTimeEntries e dataFaturamento do payload antes de salvar
    const { selectedTimeEntries: _, dataFaturamento: __, ...dataToSave } = invoiceData as any;
    
    await this.invoiceRepository.update(id, dataToSave);
    
    // Se for faturamento e não for EF, processar SIMPLES Nacional
    if (isFaturamento) {
      const updatedInvoice = await this.findOne(id);
      if (updatedInvoice.tipoEmissao !== 'EF') {
        // Usar dataFaturamento fornecida ou emissionDate atualizada
        const dataParaSimples = dataFaturamento || updatedInvoice.emissionDate;
        await this.processarSimplesNacional(updatedInvoice, dataParaSimples);
      }
    }
    
    return this.findOne(id);
  }

  /**
   * Processa o cálculo e criação/atualização da conta a pagar do SIMPLES Nacional
   * Calcula 6% sobre o valor bruto e cria/atualiza conta a pagar provisionada
   */
  private async processarSimplesNacional(invoice: Invoice, dataFaturamento?: string): Promise<void> {
    try {
      // Calcular 6% do valor bruto
      const valorBruto = parseFloat(invoice.grossValue?.toString() || '0');
      const valorSimples = valorBruto * 0.06;

      if (valorSimples <= 0) {
        return; // Não criar conta a pagar se o valor for zero
      }

      // Usar data de faturamento se fornecida, senão usar data de emissão
      const dataReferencia = dataFaturamento 
        ? new Date(dataFaturamento) 
        : (invoice.emissionDate ? new Date(invoice.emissionDate) : new Date());
      
      // Obter mês e ano da data de referência (data de faturamento)
      const mes = dataReferencia.getMonth() + 1; // 1-12
      const ano = dataReferencia.getFullYear();

      // Calcular vencimento: dia 25 do mês subsequente
      const mesSubsequente = mes === 12 ? 1 : mes + 1; // Se dezembro, próximo mês é janeiro
      const anoSubsequente = mes === 12 ? ano + 1 : ano; // Se dezembro, incrementar ano
      const vencimento = new Date(anoSubsequente, mesSubsequente - 1, 25); // getMonth() usa 0-11, então subtrair 1

      // Buscar ou criar fornecedor RECEITA FEDERAL DO BRASIL
      const fornecedor = await this.buscarOuCriarReceitaFederal(invoice.companyId);

      // Buscar ou criar classificação Tributos - SIMPLES
      const classificacao = await this.buscarOuCriarClassificacaoTributosSimples(invoice.companyId);

      // Verificar se a invoice já foi relacionada a uma conta a pagar do SIMPLES
      const relacionamentoExistente = await this.invoiceAccountPayableRepository.findOne({
        where: { invoiceId: invoice.id },
      });

      if (relacionamentoExistente) {
        console.log(`⚠️  Invoice ${invoice.invoiceNumber} já foi relacionada a uma conta a pagar do SIMPLES. Pulando...`);
        return; // Já foi processada, não processar novamente
      }

      // Buscar conta a pagar existente para o mês/ano
      const competencia = `${String(mes).padStart(2, '0')}/${ano}`;
      const descricao = `SIMPLES NACIONAL competência ${competencia}`;

      // Usar query builder para comparar campo text corretamente no SQL Server
      let accountPayable = await this.accountPayableRepository
        .createQueryBuilder('ap')
        .where('ap.companyId = :companyId', { companyId: invoice.companyId })
        .andWhere('ap.supplierId = :supplierId', { supplierId: fornecedor.id })
        .andWhere('CAST(ap.description AS NVARCHAR(MAX)) = :description', { description: descricao })
        .andWhere('ap.status = :status', { status: 'PROVISIONADA' })
        .getOne();

      if (accountPayable) {
        // Atualizar valor existente
        const novoValor = parseFloat(accountPayable.totalValue?.toString() || '0') + valorSimples;
        await this.accountPayableRepository.update(accountPayable.id, {
          totalValue: novoValor,
        });
        accountPayable = await this.accountPayableRepository.findOne({ where: { id: accountPayable.id } });
      } else {
        // Criar nova conta a pagar
        accountPayable = this.accountPayableRepository.create({
          companyId: invoice.companyId,
          supplierId: fornecedor.id,
          description: descricao,
          chartOfAccountsId: classificacao?.id,
          emissionDate: dataReferencia, // Usar data de faturamento como data de emissão da conta a pagar
          dueDate: vencimento,
          totalValue: valorSimples,
          status: 'PROVISIONADA',
        });
        accountPayable = await this.accountPayableRepository.save(accountPayable);
      }

      // Relacionar invoice com account payable
      const relacionamento = this.invoiceAccountPayableRepository.create({
        invoiceId: invoice.id,
        accountPayableId: accountPayable.id,
        valorContribuido: valorSimples,
      });
      await this.invoiceAccountPayableRepository.save(relacionamento);

      console.log(`✅ SIMPLES Nacional processado: Invoice ${invoice.invoiceNumber} contribuiu com ${valorSimples.toFixed(2)} para AccountPayable ${accountPayable.id}`);
    } catch (error) {
      console.error('Erro ao processar SIMPLES Nacional:', error);
      // Não lançar erro para não quebrar o fluxo de faturamento
    }
  }

  /**
   * Busca ou cria o fornecedor RECEITA FEDERAL DO BRASIL
   */
  private async buscarOuCriarReceitaFederal(companyId: string): Promise<Client> {
    let fornecedor = await this.clientRepository.findOne({
      where: {
        companyId,
        razaoSocial: 'RECEITA FEDERAL DO BRASIL',
      },
    });

    if (!fornecedor) {
      // Criar fornecedor
      fornecedor = this.clientRepository.create({
        companyId,
        razaoSocial: 'RECEITA FEDERAL DO BRASIL',
        name: 'RECEITA FEDERAL DO BRASIL',
      });
      fornecedor = await this.clientRepository.save(fornecedor);
      console.log('✅ Fornecedor RECEITA FEDERAL DO BRASIL criado');
    }

    return fornecedor;
  }

  /**
   * Busca ou cria a classificação Tributos - SIMPLES
   */
  private async buscarOuCriarClassificacaoTributosSimples(companyId: string): Promise<ChartOfAccounts | null> {
    let classificacao = await this.chartOfAccountsRepository.findOne({
      where: {
        companyId,
        name: 'Tributos - SIMPLES',
        type: 'DESPESA',
      },
    });

    if (!classificacao) {
      // Criar classificação
      classificacao = this.chartOfAccountsRepository.create({
        companyId,
        name: 'Tributos - SIMPLES',
        code: 'TRIBUTOS-SIMPLES',
        type: 'DESPESA',
      });
      classificacao = await this.chartOfAccountsRepository.save(classificacao);
      console.log('✅ Classificação Tributos - SIMPLES criada');
    }

    return classificacao;
  }

  async delete(id: string): Promise<void> {
    await this.invoiceRepository.delete(id);
  }

  async getProposalCompanyId(proposalId: string): Promise<{ companyId: string } | null> {
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
      select: ['companyId'],
    });
    return proposal ? { companyId: proposal.companyId } : null;
  }

  /**
   * Busca a classificação de honorários para um tipo de serviço
   * NOTA: Não cria automaticamente - as classificações devem ser criadas manualmente
   */
  private async obterOuCriarClassificacaoHonorarios(
    serviceType: string,
    companyId: string
  ): Promise<ChartOfAccounts | null> {
    if (!serviceType) return null;

    // Mapear nome do tipo de serviço para exibição
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

    const nomeTipoServico = serviceTypeNames[serviceType] || serviceType;
    const nomeClassificacao = `Honorários - ${nomeTipoServico}`;
    
    // Buscar se já existe (busca flexível por nome que começa com "Honorários -")
    let classificacao = await this.chartOfAccountsRepository.findOne({
      where: {
        companyId,
        name: nomeClassificacao,
        type: 'RECEITA'
      }
    });
    
    // Se não encontrou pelo nome exato, tentar busca mais flexível
    if (!classificacao) {
      // Buscar por qualquer nome que contenha o tipo de serviço
      const allClassifications = await this.chartOfAccountsRepository.find({
        where: {
          companyId,
          type: 'RECEITA'
        }
      });
      
      // Procurar por nome similar
      classificacao = allClassifications.find(c => 
        c.name.toLowerCase().includes('honorários') && 
        c.name.toLowerCase().includes(nomeTipoServico.toLowerCase())
      ) || null;
    }
    
    // NÃO criar automaticamente - apenas retornar se encontrado
    if (!classificacao) {
      console.warn(`⚠️  Classificação "${nomeClassificacao}" não encontrada. Crie manualmente no Plano de Contas.`);
    }
    
    return classificacao;
  }

  async createFromProposalParcels(proposalId: string, parcels: any[], companyId: string) {
    if (!parcels || parcels.length === 0) {
      throw new BadRequestException('Nenhuma parcela fornecida para criação de contas a receber.');
    }

    // Buscar proposta para obter serviceType
    const proposal = await this.proposalRepository.findOne({ 
      where: { id: proposalId },
      select: ['serviceType', 'companyId']
    });

    // Obter ou criar classificação de honorários
    let chartOfAccountsId: string | null = null;
    if (proposal?.serviceType) {
      const classificacao = await this.obterOuCriarClassificacaoHonorarios(
        proposal.serviceType,
        companyId
      );
      if (classificacao) {
        chartOfAccountsId = classificacao.id;
      }
    }

    const invoicesToCreate = parcels.map(parcel => {
      const invoiceNumber = `NEG-${proposalId.substring(0, 4)}-${String(parcel.numero).padStart(3, '0')}`;
      
      // Corrigir problema de timezone - garantir que a data seja interpretada como local
      const parseDate = (dateString: string): Date => {
        if (!dateString) return new Date();
        // Se a string já está no formato YYYY-MM-DD, adicionar T00:00:00 para evitar conversão UTC
        const dateStr = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
        return new Date(dateStr);
      };
      
      return this.invoiceRepository.create({
        companyId,
        clientId: parcel.clientId,
        proposalId,
        chartOfAccountsId, // ✅ Associar classificação
        invoiceNumber,
        emissionDate: parcel.dataFaturamento ? parseDate(parcel.dataFaturamento) : new Date(),
        dueDate: parseDate(parcel.dataVencimento),
        grossValue: parcel.valor,
        status: 'PROVISIONADA',
        origem: 'NEGOCIACAO',
      });
    });

    const savedInvoices = await this.invoiceRepository.save(invoicesToCreate);
    return Array.isArray(savedInvoices) ? savedInvoices : [savedInvoices];
  }

  async findByProposalId(proposalId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { proposalId },
      relations: ['client', 'proposal', 'chartOfAccounts'],
      order: { emissionDate: 'ASC' },
    });
  }

  async updateStatus(id: string, status: string): Promise<Invoice> {
    await this.invoiceRepository.update(id, { status });
    return this.findOne(id);
  }

  async updateMultipleStatus(ids: string[], status: string): Promise<void> {
    if (ids.length === 0) return;
    await this.invoiceRepository.update(ids, { status });
  }
}

