import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { AccountsPayableService } from './accounts-payable.service';
import { AccountPayable } from '../../database/entities/account-payable.entity';

@Controller('accounts-payable')
export class AccountsPayableController {
  constructor(private accountsPayableService: AccountsPayableService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<AccountPayable[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.accountsPayableService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AccountPayable> {
    return this.accountsPayableService.findOne(id);
  }

  @Post()
  async create(@Body() accountPayableData: Partial<AccountPayable>, @Request() req?: any): Promise<AccountPayable> {
    const companyId = req?.user?.companyId || accountPayableData.companyId;
    if (companyId && !accountPayableData.companyId) {
      accountPayableData.companyId = companyId;
    }
    return this.accountsPayableService.create(accountPayableData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() accountPayableData: Partial<AccountPayable>): Promise<AccountPayable> {
    return this.accountsPayableService.update(id, accountPayableData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.accountsPayableService.delete(id);
  }
}

