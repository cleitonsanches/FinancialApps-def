import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ProposalsService } from './proposals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(['proposals', 'negotiations'])
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get('next-number')
  async getNextNumber(@Request() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Usuário não possui empresa vinculada. Por favor, cadastre uma empresa primeiro.');
    }
    const nextNumber = await this.proposalsService.generateProposalNumber(companyId);
    return { numeroProposta: nextNumber };
  }

  @Post()
  create(@Body() createProposalDto: any, @Request() req: any) {
    const companyId = req.user?.companyId;
    const userId = req.user?.id;

    if (!companyId) {
      throw new BadRequestException('Usuário não possui empresa vinculada. Por favor, cadastre uma empresa primeiro.');
    }

    if (!userId) {
      throw new BadRequestException('Usuário não identificado.');
    }

    return this.proposalsService.create(createProposalDto, companyId, userId);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.proposalsService.findAll(req.user?.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.proposalsService.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProposalDto: any, @Request() req: any) {
    return this.proposalsService.update(id, updateProposalDto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.proposalsService.remove(id, req.user?.companyId);
  }
}

