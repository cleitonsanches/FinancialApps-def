import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceTax } from '../../database/entities/invoice.entity';
import { Proposal } from '../../database/entities/proposal.entity';
import { ChartOfAccounts } from '../../database/entities/chart-of-accounts.entity';

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
    return this.invoiceRepository.findOne({ 
      where: { id },
      relations: ['client', 'proposal', 'taxes', 'chartOfAccounts', 'contaCorrente'],
    });
  }

  async create(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(invoiceData);
    return this.invoiceRepository.save(invoice);
  }

  async update(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    await this.invoiceRepository.update(id, invoiceData);
    return this.findOne(id);
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

