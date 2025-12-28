import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reimbursement } from '../../database/entities/reimbursement.entity';

@Injectable()
export class ReimbursementsService {
  constructor(
    @InjectRepository(Reimbursement)
    private reimbursementRepository: Repository<Reimbursement>,
  ) {}

  async findAll(companyId?: string): Promise<Reimbursement[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.reimbursementRepository.find({
      where,
      relations: ['user', 'accountPayable', 'invoice', 'chartOfAccounts'],
      order: { expenseDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Reimbursement> {
    const reimbursement = await this.reimbursementRepository.findOne({
      where: { id },
      relations: ['user', 'accountPayable', 'invoice', 'chartOfAccounts'],
    });
    if (!reimbursement) {
      throw new NotFoundException(`Reembolso com ID ${id} não encontrado`);
    }
    return reimbursement;
  }

  async create(reimbursementData: Partial<Reimbursement>): Promise<Reimbursement> {
    if (!reimbursementData.companyId) {
      throw new BadRequestException('companyId é obrigatório');
    }
    if (!reimbursementData.description) {
      throw new BadRequestException('description é obrigatório');
    }
    if (!reimbursementData.amount) {
      throw new BadRequestException('amount é obrigatório');
    }
    if (!reimbursementData.expenseDate) {
      throw new BadRequestException('expenseDate é obrigatório');
    }

    // Validar que pelo menos um vínculo existe (accountPayableId ou invoiceId)
    if (!reimbursementData.accountPayableId && !reimbursementData.invoiceId) {
      throw new BadRequestException('É necessário vincular a uma Conta a Pagar ou Conta a Receber');
    }

    const reimbursement = this.reimbursementRepository.create({
      ...reimbursementData,
      status: reimbursementData.status || 'SOLICITADO',
    });
    return this.reimbursementRepository.save(reimbursement);
  }

  async update(id: string, reimbursementData: Partial<Reimbursement>): Promise<Reimbursement> {
    await this.reimbursementRepository.update(id, reimbursementData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.reimbursementRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Reembolso com ID ${id} não encontrado`);
    }
  }
}

