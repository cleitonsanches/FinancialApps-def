import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { ProposalsService } from './proposals.service';
import { ProposalPdfService } from './proposal-pdf.service';
import { Proposal } from '../../database/entities/proposal.entity';

@Controller(['proposals', 'negotiations'])
export class ProposalsController {
  constructor(
    private proposalsService: ProposalsService,
    private proposalPdfService: ProposalPdfService,
  ) {}

  @Get()
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Request() req?: any
  ): Promise<Proposal[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.proposalsService.findAll(effectiveCompanyId, status);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Proposal> {
    return this.proposalsService.findOne(id);
  }

  @Post()
  async create(@Body() proposalData: Partial<Proposal>, @Request() req?: any): Promise<Proposal> {
    const companyId = req?.user?.companyId || proposalData.companyId;
    const userId = req?.user?.id || proposalData.userId;
    
    console.log('ProposalsController.create - req?.user:', req?.user);
    console.log('ProposalsController.create - companyId:', companyId, 'userId:', userId);
    console.log('ProposalsController.create - proposalData recebido:', proposalData);
    
    if (companyId && !proposalData.companyId) {
      proposalData.companyId = companyId;
    }
    
    if (userId && !proposalData.userId) {
      proposalData.userId = userId;
    }
    
    // Validar campos obrigatórios
    if (!proposalData.companyId) {
      throw new Error('companyId é obrigatório');
    }
    if (!proposalData.userId) {
      throw new Error('userId é obrigatório');
    }
    if (!proposalData.clientId) {
      throw new Error('clientId é obrigatório');
    }
    if (!proposalData.title) {
      throw new Error('title é obrigatório');
    }
    
    console.log('ProposalsController.create - proposalData final:', proposalData);
    
    return this.proposalsService.create(proposalData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() proposalData: Partial<Proposal>): Promise<Proposal> {
    return this.proposalsService.update(id, proposalData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.proposalsService.delete(id);
  }

  @Post(':id/create-project-from-template')
  async createProjectFromTemplate(
    @Param('id') proposalId: string,
    @Body() body: { templateId: string; startDate: string },
  ): Promise<any> {
    const startDate = new Date(body.startDate);
    return this.proposalsService.createProjectFromTemplate(proposalId, body.templateId, startDate);
  }

  @Post(':id/criar-manutencao-vinculada')
  async criarManutencaoVinculada(
    @Param('id') propostaPrincipalId: string,
    @Body() dadosManutencao: {
      valorMensalManutencao?: number;
      dataInicioManutencao?: string;
      descricaoManutencao?: string;
      vencimentoManutencao?: string;
    },
  ): Promise<Proposal> {
    return this.proposalsService.criarPropostaManutencaoVinculada(propostaPrincipalId, {
      valorMensalManutencao: dadosManutencao.valorMensalManutencao,
      dataInicioManutencao: dadosManutencao.dataInicioManutencao ? new Date(dadosManutencao.dataInicioManutencao) : undefined,
      vencimentoManutencao: dadosManutencao.vencimentoManutencao ? new Date(dadosManutencao.vencimentoManutencao) : undefined,
      descricaoManutencao: dadosManutencao.descricaoManutencao,
    });
  }

  @Get(':id/pdf')
  async generatePdf(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('observacoes') observacoes?: string,
  ): Promise<void> {
    try {
      // Decodificar observações se fornecidas (pode vir encoded na URL)
      let decodedObservacoes: string | undefined = undefined;
      if (observacoes) {
        try {
          decodedObservacoes = decodeURIComponent(observacoes);
        } catch (error) {
          // Se falhar a decodificação, usar o valor original
          decodedObservacoes = observacoes;
        }
      }
      
      const pdfBuffer = await this.proposalPdfService.generatePdf(id, decodedObservacoes);
      const proposal = await this.proposalsService.findOne(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="proposta-${proposal.numero || id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      res.status(500).json({ message: error.message || 'Erro ao gerar PDF' });
    }
  }
}

