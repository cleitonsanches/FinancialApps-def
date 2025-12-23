import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../../database/entities/bank-account.entity';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
  ) {}

  async create(createBankAccountDto: any, companyId: string) {
    const account = this.bankAccountRepository.create({
      ...createBankAccountDto,
      companyId,
    });
    return await this.bankAccountRepository.save(account);
  }

  async findAll(companyId: string) {
    return await this.bankAccountRepository.find({
      where: { companyId },
      order: { bankName: 'ASC' },
    });
  }

  async findOne(id: string, companyId: string) {
    const account = await this.bankAccountRepository.findOne({
      where: { id, companyId },
    });

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    return account;
  }

  async update(id: string, updateBankAccountDto: any, companyId: string) {
    await this.bankAccountRepository.update({ id, companyId }, updateBankAccountDto);
    return await this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string) {
    await this.bankAccountRepository.delete({ id, companyId });
  }
}

