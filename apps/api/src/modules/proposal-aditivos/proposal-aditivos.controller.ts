import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProposalAditivosService } from './proposal-aditivos.service';
import { ProposalAditivo } from '../../database/entities/proposal-aditivo.entity';

@Controller('proposal-aditivos')
export class ProposalAditivosController {
  constructor(
    private readonly proposalAditivosService: ProposalAditivosService,
  ) {}

  @Get()
  async findAll(@Query('proposalId') proposalId?: string): Promise<ProposalAditivo[]> {
    return this.proposalAditivosService.findAll(proposalId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProposalAditivo> {
    return this.proposalAditivosService.findOne(id);
  }

  @Post()
  async create(@Body() aditivoData: Partial<ProposalAditivo>): Promise<ProposalAditivo> {
    return this.proposalAditivosService.create(aditivoData);
  }

  @Post('calcular')
  async criarComCalculo(
    @Body() data: {
      proposalId: string;
      dataAditivo: string;
      percentualReajuste: number;
      valorAnterior: number;
      anoReferencia: number;
    }
  ): Promise<ProposalAditivo> {
    return this.proposalAditivosService.criarAditivo(
      data.proposalId,
      new Date(data.dataAditivo),
      data.percentualReajuste,
      data.valorAnterior,
      data.anoReferencia
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() aditivoData: Partial<ProposalAditivo>,
  ): Promise<ProposalAditivo> {
    return this.proposalAditivosService.update(id, aditivoData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.proposalAditivosService.delete(id);
    return { message: 'Aditivo deletado com sucesso' };
  }

  @Get('proposal/:proposalId')
  async findByProposal(@Param('proposalId') proposalId: string): Promise<ProposalAditivo[]> {
    return this.proposalAditivosService.findByProposal(proposalId);
  }
}

