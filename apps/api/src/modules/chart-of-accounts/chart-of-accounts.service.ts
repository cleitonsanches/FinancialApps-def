import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccounts } from '../../database/entities/chart-of-accounts.entity';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>,
  ) {}

  async findAll(companyId?: string): Promise<ChartOfAccounts[]> {
    if (companyId) {
      return this.chartOfAccountsRepository.find({ where: { companyId } });
    }
    return this.chartOfAccountsRepository.find();
  }

  async findOne(id: string): Promise<ChartOfAccounts> {
    return this.chartOfAccountsRepository.findOne({ where: { id } });
  }

  async create(chartData: Partial<ChartOfAccounts>): Promise<ChartOfAccounts> {
    const chart = this.chartOfAccountsRepository.create(chartData);
    return this.chartOfAccountsRepository.save(chart);
  }

  async update(id: string, chartData: Partial<ChartOfAccounts>): Promise<ChartOfAccounts> {
    await this.chartOfAccountsRepository.update(id, chartData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.chartOfAccountsRepository.delete(id);
  }
}

