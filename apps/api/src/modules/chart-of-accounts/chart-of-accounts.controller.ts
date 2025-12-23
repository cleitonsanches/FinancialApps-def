import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { ChartOfAccounts } from '../../database/entities/chart-of-accounts.entity';

@Controller('chart-of-accounts')
export class ChartOfAccountsController {
  constructor(private chartOfAccountsService: ChartOfAccountsService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<ChartOfAccounts[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.chartOfAccountsService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ChartOfAccounts> {
    return this.chartOfAccountsService.findOne(id);
  }

  @Post()
  async create(@Body() chartData: Partial<ChartOfAccounts>): Promise<ChartOfAccounts> {
    return this.chartOfAccountsService.create(chartData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() chartData: Partial<ChartOfAccounts>): Promise<ChartOfAccounts> {
    return this.chartOfAccountsService.update(id, chartData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.chartOfAccountsService.delete(id);
  }
}

