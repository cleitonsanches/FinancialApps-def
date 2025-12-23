import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChartOfAccount } from '../../database/entities/chart-of-accounts.entity';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    @InjectRepository(ChartOfAccount)
    private chartOfAccountRepository: Repository<ChartOfAccount>,
  ) {}

  async create(createChartOfAccountDto: any, companyId: string) {
    const account = this.chartOfAccountRepository.create({
      ...createChartOfAccountDto,
      companyId,
    });
    return await this.chartOfAccountRepository.save(account);
  }

  async findAll(companyId: string) {
    return await this.chartOfAccountRepository.find({
      where: { companyId },
      order: { code: 'ASC' },
    });
  }

  async findOne(id: string, companyId: string) {
    const account = await this.chartOfAccountRepository.findOne({
      where: { id, companyId },
    });

    if (!account) {
      throw new NotFoundException('Conta não encontrada');
    }

    return account;
  }

  async update(id: string, updateChartOfAccountDto: any, companyId: string) {
    await this.chartOfAccountRepository.update({ id, companyId }, updateChartOfAccountDto);
    return await this.findOne(id, companyId);
  }

  async remove(id: string, companyId: string) {
    await this.chartOfAccountRepository.delete({ id, companyId });
  }
}

