import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProposalAditivo } from '../../database/entities/proposal-aditivo.entity';
import { Proposal } from '../../database/entities/proposal.entity';

@Injectable()
export class ProposalAditivosService {
  constructor(
    @InjectRepository(ProposalAditivo)
    private aditivoRepository: Repository<ProposalAditivo>,
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
  ) {}

  async findAll(proposalId?: string): Promise<ProposalAditivo[]> {
    if (proposalId) {
      return this.aditivoRepository.find({
        where: { proposalId },
        order: { dataAditivo: 'DESC' }
      });
    }
    return this.aditivoRepository.find({ order: { dataAditivo: 'DESC' } });
  }

  async findOne(id: string): Promise<ProposalAditivo> {
    const aditivo = await this.aditivoRepository.findOne({ 
      where: { id },
      relations: ['proposal']
    });
    
    if (!aditivo) {
      throw new NotFoundException(`Aditivo com ID ${id} não encontrado`);
    }
    
    return aditivo;
  }

  async create(aditivoData: Partial<ProposalAditivo>): Promise<ProposalAditivo> {
    // Verificar se a proposta existe
    if (aditivoData.proposalId) {
      const proposal = await this.proposalRepository.findOne({
        where: { id: aditivoData.proposalId }
      });
      
      if (!proposal) {
        throw new NotFoundException(`Proposta com ID ${aditivoData.proposalId} não encontrada`);
      }
    }
    
    const aditivo = this.aditivoRepository.create(aditivoData);
    return this.aditivoRepository.save(aditivo);
  }

  async update(id: string, aditivoData: Partial<ProposalAditivo>): Promise<ProposalAditivo> {
    await this.aditivoRepository.update(id, aditivoData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.aditivoRepository.delete(id);
  }

  async findByProposal(proposalId: string): Promise<ProposalAditivo[]> {
    return this.aditivoRepository.find({
      where: { proposalId },
      order: { dataAditivo: 'DESC', createdAt: 'DESC' }
    });
  }

  /**
   * Calcula o valor novo após aplicar o percentual de reajuste
   */
  calcularValorNovo(valorAnterior: number, percentualReajuste: number): number {
    return valorAnterior * (1 + percentualReajuste / 100);
  }

  /**
   * Cria um aditivo e retorna os dados calculados
   */
  async criarAditivo(
    proposalId: string,
    dataAditivo: Date,
    percentualReajuste: number,
    valorAnterior: number,
    anoReferencia: number
  ): Promise<ProposalAditivo> {
    const valorNovo = this.calcularValorNovo(valorAnterior, percentualReajuste);
    
    return this.create({
      proposalId,
      dataAditivo,
      percentualReajuste,
      valorAnterior,
      valorNovo,
      anoReferencia
    });
  }
}


