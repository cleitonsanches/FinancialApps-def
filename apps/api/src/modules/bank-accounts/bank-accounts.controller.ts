import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard)
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Post()
  create(@Body() createBankAccountDto: any, @Request() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Usuário não possui empresa vinculada');
    }
    return this.bankAccountsService.create(createBankAccountDto, companyId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.bankAccountsService.findAll(req.user?.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.bankAccountsService.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBankAccountDto: any, @Request() req: any) {
    return this.bankAccountsService.update(id, updateBankAccountDto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.bankAccountsService.remove(id, req.user?.companyId);
  }
}

