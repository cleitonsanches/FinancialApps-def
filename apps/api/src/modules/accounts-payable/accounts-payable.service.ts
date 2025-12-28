import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountPayable } from '../../database/entities/account-payable.entity';

@Injectable()
export class AccountsPayableService {
  constructor(
    @InjectRepository(AccountPayable)
    private accountPayableRepository: Repository<AccountPayable>,
  ) {}

  async findAll(companyId?: string): Promise<AccountPayable[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.accountPayableRepository.find({
      where,
      relations: ['supplier', 'chartOfAccounts', 'bankAccount', 'destinatarioFaturaReembolso'],
      order: { dueDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<AccountPayable> {
    const accountPayable = await this.accountPayableRepository.findOne({
      where: { id },
      relations: ['supplier', 'chartOfAccounts', 'bankAccount', 'destinatarioFaturaReembolso', 'reimbursements'],
    });
    if (!accountPayable) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada`);
    }
    return accountPayable;
  }

  async create(accountPayableData: Partial<AccountPayable>): Promise<AccountPayable> {
    if (!accountPayableData.companyId) {
      throw new BadRequestException('companyId é obrigatório');
    }
    if (!accountPayableData.supplierId) {
      throw new BadRequestException('supplierId é obrigatório');
    }
    if (!accountPayableData.description) {
      throw new BadRequestException('description é obrigatório');
    }
    if (!accountPayableData.totalValue) {
      throw new BadRequestException('totalValue é obrigatório');
    }

    const accountPayable = this.accountPayableRepository.create({
      ...accountPayableData,
      status: accountPayableData.status || 'PROVISIONADA',
    });
    return this.accountPayableRepository.save(accountPayable);
  }

  async update(id: string, accountPayableData: Partial<AccountPayable>): Promise<AccountPayable> {
    await this.accountPayableRepository.update(id, accountPayableData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.accountPayableRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada`);
    }
  }
}

