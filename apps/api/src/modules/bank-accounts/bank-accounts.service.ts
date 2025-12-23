import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from '../../database/entities/bank-account.entity';

@Injectable()
export class BankAccountsService {
  constructor(
    @InjectRepository(BankAccount)
    private bankAccountRepository: Repository<BankAccount>,
  ) {}

  async findAll(companyId?: string): Promise<BankAccount[]> {
    if (companyId) {
      return this.bankAccountRepository.find({ where: { companyId } });
    }
    return this.bankAccountRepository.find();
  }

  async findOne(id: string): Promise<BankAccount> {
    return this.bankAccountRepository.findOne({ where: { id } });
  }

  async create(bankAccountData: Partial<BankAccount>): Promise<BankAccount> {
    // Remover pixKey temporariamente até a migração ser executada
    const { pixKey, ...dataWithoutPixKey } = bankAccountData as any;
    const bankAccount = this.bankAccountRepository.create(dataWithoutPixKey as Partial<BankAccount>);
    return this.bankAccountRepository.save(bankAccount);
  }

  async update(id: string, bankAccountData: Partial<BankAccount>): Promise<BankAccount> {
    // Remover pixKey temporariamente até a migração ser executada
    const { pixKey, ...dataWithoutPixKey } = bankAccountData as any;
    await this.bankAccountRepository.update(id, dataWithoutPixKey);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.bankAccountRepository.delete(id);
  }
}

