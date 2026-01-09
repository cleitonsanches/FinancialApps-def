import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccount } from '../../database/entities/bank-account.entity';

@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private bankAccountsService: BankAccountsService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<BankAccount[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    console.log('BankAccountsController.findAll - companyId:', companyId);
    console.log('BankAccountsController.findAll - req.user:', req?.user);
    console.log('BankAccountsController.findAll - effectiveCompanyId:', effectiveCompanyId);
    const accounts = await this.bankAccountsService.findAll(effectiveCompanyId);
    console.log('BankAccountsController.findAll - contas encontradas:', accounts.length);
    return accounts;
  }

  @Get('default')
  async findDefault(@Query('companyId') companyId?: string, @Request() req?: any): Promise<BankAccount | null> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.bankAccountsService.findDefault(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<BankAccount> {
    return this.bankAccountsService.findOne(id);
  }

  @Post()
  async create(@Body() bankAccountData: Partial<BankAccount>, @Request() req?: any): Promise<BankAccount> {
    const companyId = req?.user?.companyId || bankAccountData.companyId;
    if (companyId && !bankAccountData.companyId) {
      bankAccountData.companyId = companyId;
    }
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

