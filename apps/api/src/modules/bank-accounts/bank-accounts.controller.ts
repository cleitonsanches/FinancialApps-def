import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccount } from '../../database/entities/bank-account.entity';

@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private bankAccountsService: BankAccountsService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<BankAccount[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.bankAccountsService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BankAccount> {
    return this.bankAccountsService.findOne(id);
  }

  @Post()
  async create(@Body() bankAccountData: Partial<BankAccount>): Promise<BankAccount> {
    return this.bankAccountsService.create(bankAccountData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() bankAccountData: Partial<BankAccount>): Promise<BankAccount> {
    return this.bankAccountsService.update(id, bankAccountData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.bankAccountsService.delete(id);
  }
}

