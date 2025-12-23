import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal } from '../../database/entities/proposal.entity';

@Injectable()
export class ProposalsService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
  ) {}

  async generateProposalNumber(companyId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    
    // Buscar todas as propostas do ano atual para esta empresa
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    
    const proposalsThisYear = await this.proposalRepository.find({
      where: { 
        companyId,
      },
      order: { dataProposta: 'DESC' },
    });

    // Filtrar propostas do ano atual e extrair o maior sequencial
    let maxSequence = 0;
    
    for (const proposal of proposalsThisYear) {
      if (proposal.numeroProposta) {
        const parts = proposal.numeroProposta.split('/');
        if (parts.length === 2) {
          const proposalYear = parseInt(parts[1]);
          const sequence = parseInt(parts[0]);
          
          if (proposalYear === currentYear && !isNaN(sequence)) {
            if (sequence > maxSequence) {
              maxSequence = sequence;
            }
          }
        }
      }
    }

    const nextSequence = maxSequence + 1;
    return `${nextSequence}/${currentYear}`;
  }

  async create(createProposalDto: any, companyId: string, userId: string) {
    // Gerar número da proposta automaticamente se não fornecido
    let numeroProposta = createProposalDto.numeroProposta;
    if (!numeroProposta) {
      numeroProposta = await this.generateProposalNumber(companyId);
    }

    // Calcular data de validade: 10 dias após a criação (se não fornecida)
    let dataValidade = createProposalDto.dataValidade;
    if (!dataValidade) {
      const hoje = new Date();
      hoje.setDate(hoje.getDate() + 10);
      dataValidade = hoje;
    }

    // Calcular data condicionada ao aceite: mesma da validade (se não fornecida)
    let dataCondicionadaAceite = createProposalDto.dataCondicionadaAceite;
    if (!dataCondicionadaAceite) {
      dataCondicionadaAceite = dataValidade;
    }

    const proposal = this.proposalRepository.create({
      ...createProposalDto,
      numeroProposta,
      companyId,
      userId,
      dataValidade,
      dataCondicionadaAceite,
    });
    return await this.proposalRepository.save(proposal);
  }

  async findAll(companyId: string) {
    return await this.proposalRepository.find({
      where: { companyId },
      relations: ['client', 'user'],
      order: { dataProposta: 'DESC' },
    });
  }

  async findOne(id: string, companyId: string) {
    const proposal = await this.proposalRepository.findOne({
      where: { id, companyId },
      relations: ['client', 'user', 'templateProposta'],
    });

    if (!proposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    return proposal;
  }

  async update(id: string, updateProposalDto: any, companyId: string) {
    // Buscar a proposta atual para verificar o status
    const currentProposal = await this.proposalRepository.findOne({
      where: { id, companyId },
    });

    if (!currentProposal) {
      throw new NotFoundException('Proposta não encontrada');
    }

    // Se o status está sendo alterado para ENVIADA ou RE_ENVIADA, atualizar data de validade
    if ((updateProposalDto.status === 'ENVIADA' || updateProposalDto.status === 'RE_ENVIADA') && 
        currentProposal.status !== 'ENVIADA' && currentProposal.status !== 'RE_ENVIADA') {
      // Calcular nova data de validade: 10 dias após a alteração do status
      const hoje = new Date();
      hoje.setDate(hoje.getDate() + 10);
      updateProposalDto.dataValidade = hoje;
      
      // Se data condicionada não foi fornecida, usar a mesma da validade
      if (!updateProposalDto.dataCondicionadaAceite) {
        updateProposalDto.dataCondicionadaAceite = hoje;
      }
    }

    // Se o status atual é ENVIADA e não está sendo alterado explicitamente,
    // alterar automaticamente para REVISADA
    // Isso acontece quando a proposta é editada (campos alterados) mas o status não é explicitamente mudado
    if (currentProposal.status === 'ENVIADA' && updateProposalDto.status === undefined) {
      updateProposalDto.status = 'REVISADA';
    }

    // Remover campos que não existem na entidade
    const allowedFields = [
      'clientId', 'titulo', 'valorProposto', 'valorTotal', 'status',
      'templatePropostaId', 'descricaoProjeto', 'tipoContratacao',
      'tipoFaturamento', 'horasEstimadas', 'dataInicio', 'dataConclusao',
      'inicioFaturamento', 'fimFaturamento', 'dataVencimento',
      'condicaoPagamento', 'sistemaOrigem', 'sistemaDestino',
      'produto', 'manutencoes', 'dataValidade', 'dataCondicionadaAceite'
    ];

    const filteredDto: any = {};
    Object.keys(updateProposalDto).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredDto[key] = updateProposalDto[key];
      }
    });

    await this.proposalRepository.update({ id, companyId }, filteredDto);
    return await this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string) {
    await this.proposalRepository.delete({ id, companyId });
  }
}

