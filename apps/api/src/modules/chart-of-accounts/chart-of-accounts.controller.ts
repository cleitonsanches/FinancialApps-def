import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chart-of-accounts')
@UseGuards(JwtAuthGuard)
export class ChartOfAccountsController {
  constructor(private readonly chartOfAccountsService: ChartOfAccountsService) {}

  @Post()
  create(@Body() createChartOfAccountDto: any, @Request() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Usuário não possui empresa vinculada');
    }
    return this.chartOfAccountsService.create(createChartOfAccountDto, companyId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.chartOfAccountsService.findAll(req.user?.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.chartOfAccountsService.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChartOfAccountDto: any, @Request() req: any) {
    return this.chartOfAccountsService.update(id, updateChartOfAccountDto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.chartOfAccountsService.remove(id, req.user?.companyId);
  }
}

