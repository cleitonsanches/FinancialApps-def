import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Proposal } from '../../database/entities/proposal.entity';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';

const PDFDocument = require('pdfkit');

@Injectable()
export class ProposalPdfService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(TimeEntry)
    private timeEntryRepository: Repository<TimeEntry>,
  ) {}

  async generatePdf(proposalId: string, observacoes?: string): Promise<Buffer> {
    // Buscar proposta com todos os relacionamentos
    const proposal = await this.proposalRepository.findOne({
      where: { id: proposalId },
      relations: ['client', 'user', 'company'],
    });

    if (!proposal) {
      throw new Error('Proposta não encontrada');
    }

    // Buscar dados relacionados se a proposta estiver fechada
    let projects: Project[] = [];
    let invoices: Invoice[] = [];
    let timeEntries: TimeEntry[] = [];

    if (proposal.status === 'FECHADA') {
      projects = await this.projectRepository.find({
        where: { proposalId: proposalId },
        relations: ['tasks', 'client'],
      });

      invoices = await this.invoiceRepository.find({
        where: { proposalId: proposalId },
        relations: ['client'],
      });

      // Buscar time entries dos projetos relacionados
      const projectIds = projects.map(p => p.id);
      if (projectIds.length > 0) {
        timeEntries = await this.timeEntryRepository.find({
          where: { projectId: In(projectIds) },
          relations: ['user', 'task', 'project'],
        });
      }
    }

    // Converter parcelas de JSON string para array
    let parcelas: any[] = [];
    if (proposal.parcelas) {
      try {
        parcelas = typeof proposal.parcelas === 'string' 
          ? JSON.parse(proposal.parcelas) 
          : proposal.parcelas;
      } catch (e) {
        console.error('Erro ao fazer parse das parcelas:', e);
      }
    }

    // Criar PDF
    const doc = new PDFDocument({ 
      margin: 40,
      size: 'A4',
    });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Cores da empresa
    const primaryColor = '#1e40af'; // Azul escuro
    const secondaryColor = '#3b82f6'; // Azul
    const lightGray = '#f3f4f6';
    const darkGray = '#374151';
    const green = '#10b981';
    const orange = '#f59e0b';
    const red = '#ef4444';

    // Cabeçalho com cor
    const headerHeight = 100;
    doc.rect(0, 0, doc.page.width, headerHeight)
      .fill(primaryColor);
    
    doc.fillColor('#ffffff')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('PRECISION DADOS & SOLUÇÕES', 40, 30, { align: 'center' });
    
    doc.fontSize(16)
      .font('Helvetica')
      .text('PROPOSTA COMERCIAL', 40, 60, { align: 'center' });

    let currentY = headerHeight + 30;

    // Container: Informações da Proposta
    currentY = this.drawSectionContainer(doc, currentY, 'INFORMAÇÕES DA PROPOSTA', primaryColor);
    
    const infoBoxY = currentY + 10;
    doc.fillColor(darkGray)
      .fontSize(10)
      .font('Helvetica');
    
    currentY = infoBoxY;
    
    // Linha 1: Número e Status
    currentY = this.drawInfoRow(doc, 60, currentY, 'Número:', proposal.numero || 'N/A', 250);
    const statusColor = this.getStatusColor(proposal.status);
    currentY = this.drawInfoRowWithColor(doc, 350, currentY - 15, 'Status:', this.getStatusLabel(proposal.status), statusColor, 200);
    currentY += 5;

    // Linha 2: Cliente
    currentY = this.drawInfoRow(doc, 60, currentY, 'Cliente:', proposal.client?.razaoSocial || proposal.client?.name || 'N/A', 450);
    
    // Linha 3: CNPJ/CPF
    if (proposal.client?.cnpjCpf) {
      currentY = this.drawInfoRow(doc, 60, currentY, 'CNPJ/CPF:', proposal.client.cnpjCpf, 300);
    }
    
    // Linha 4: Título
    currentY = this.drawInfoRow(doc, 60, currentY, 'Título:', proposal.title || 'N/A', 450);
    
    currentY += 10;

    // Container: Detalhes do Serviço
    if (proposal.serviceType || proposal.tipoContratacao) {
      currentY = this.drawSectionContainer(doc, currentY, 'DETALHES DO SERVIÇO', secondaryColor);
      currentY += 10;

      if (proposal.serviceType) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Tipo de Serviço:', proposal.serviceType, 400);
      }
      if (proposal.tipoContratacao) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Tipo de Contratação:', proposal.tipoContratacao, 400);
      }
      
      currentY += 10;
    }

    // Container: Valores
    if (proposal.valorProposta || proposal.valorPorHora || proposal.horasEstimadas) {
      currentY = this.drawSectionContainer(doc, currentY, 'VALORES E PRAZOS', green);
      currentY += 10;

      if (proposal.valorProposta) {
        doc.fillColor(darkGray).fontSize(10).font('Helvetica-Bold');
        doc.text('Valor da Proposta:', 60, currentY);
        doc.fillColor(green).fontSize(14);
        doc.text(`R$ ${this.formatCurrency(proposal.valorProposta)}`, 200, currentY);
        currentY += 20;
      }
      if (proposal.valorPorHora) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Valor por Hora:', `R$ ${this.formatCurrency(proposal.valorPorHora)}`, 300);
      }
      if (proposal.horasEstimadas) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Horas Estimadas:', `${proposal.horasEstimadas}h`, 200);
      }
      
      currentY += 10;
    }

    // Container: Datas e Prazos
    const hasDates = proposal.dataInicio || proposal.previsaoConclusao || proposal.inicioFaturamento || 
                     proposal.dataFaturamento || proposal.dataVencimento;
    if (hasDates) {
      currentY = this.drawSectionContainer(doc, currentY, 'DATAS E PRAZOS', orange);
      currentY += 10;

      if (proposal.dataInicio) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Início:', this.formatDate(proposal.dataInicio), 250);
      }
      if (proposal.previsaoConclusao) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Previsão de Conclusão:', this.formatDate(proposal.previsaoConclusao), 250);
      }
      if (proposal.inicioFaturamento) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Início do Faturamento:', this.formatDate(proposal.inicioFaturamento), 250);
      }
      if (proposal.dataFaturamento) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data do Faturamento:', this.formatDate(proposal.dataFaturamento), 250);
      }
      if (proposal.dataVencimento) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Vencimento:', this.formatDate(proposal.dataVencimento), 250);
      }
      
      currentY += 10;
    }

    // Campos de Validade e Observações (se preenchidos)
    if (proposal.dataValidade || proposal.dataLimiteAceite || proposal.observacoes) {
      currentY = this.drawSectionContainer(doc, currentY, 'VALIDADE DA PROPOSTA E OBSERVAÇÕES', orange);
      currentY += 10;

      if (proposal.dataValidade) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Validade:', this.formatDate(proposal.dataValidade), 250);
      }
      if (proposal.dataLimiteAceite) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data Limite para Aceite:', this.formatDate(proposal.dataLimiteAceite), 250);
      }
      
      // Observações da negociação (se houver)
      if (proposal.observacoes) {
        doc.fillColor(darkGray).fontSize(10).font('Helvetica');
        doc.text('Observações:', 60, currentY);
        doc.text(proposal.observacoes, 60, currentY + 15, { width: 500 });
        currentY += 35;
      }
      
      currentY += 10;
    }

    // Observações adicionais (se fornecidas via parâmetro)
    if (observacoes) {
      currentY = this.drawSectionContainer(doc, currentY, 'OBSERVAÇÕES ADICIONAIS', darkGray);
      currentY += 10;
      
      doc.fillColor(darkGray)
        .fontSize(10)
        .font('Helvetica');
      
      // Quebrar texto em múltiplas linhas se necessário
      const lines = doc.heightOfString(observacoes, {
        width: 500,
        align: 'left',
      });
      
      doc.text(observacoes, 60, currentY, {
        width: 500,
        align: 'left',
      });
      
      currentY += lines + 10;
    }

    // Campos específicos por tipo de serviço
    
    // ASSINATURAS
    if (proposal.serviceType === 'ASSINATURAS') {
      currentY = this.drawSectionContainer(doc, currentY, 'INFORMAÇÕES DE ASSINATURA', secondaryColor);
      currentY += 10;

      if (proposal.tipoProdutoAssinado) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Tipo de Produto:', proposal.tipoProdutoAssinado, 300);
      }
      if (proposal.quantidadeUsuarios) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Quantidade de Usuários:', String(proposal.quantidadeUsuarios), 200);
      }
      if (proposal.valorUnitarioUsuario) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Valor Unitário por Usuário:', `R$ ${this.formatCurrency(proposal.valorUnitarioUsuario)}`, 250);
      }
      if (proposal.dataInicioAssinatura) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Início:', this.formatDate(proposal.dataInicioAssinatura), 250);
      }
      if (proposal.vencimentoAssinatura) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Renovação:', this.formatDate(proposal.vencimentoAssinatura), 250);
      }
      
      currentY += 10;
    }

    // ANÁLISE DE DADOS
    if (proposal.serviceType === 'ANALISE_DADOS') {
      currentY = this.drawSectionContainer(doc, currentY, 'INFORMAÇÕES DE ANÁLISE DE DADOS', secondaryColor);
      currentY += 10;

      if (proposal.dataInicioAnalise) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Início:', this.formatDate(proposal.dataInicioAnalise), 250);
      }
      if (proposal.dataProgramadaHomologacao) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data Programada para Homologação:', this.formatDate(proposal.dataProgramadaHomologacao), 250);
      }
      if (proposal.dataProgramadaProducao) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data Programada para Produção:', this.formatDate(proposal.dataProgramadaProducao), 250);
      }
      
      currentY += 10;
    }

    // MANUTENÇÕES
    if (proposal.serviceType === 'MANUTENCOES') {
      currentY = this.drawSectionContainer(doc, currentY, 'INFORMAÇÕES DE MANUTENÇÃO', secondaryColor);
      currentY += 10;

      if (proposal.descricaoManutencao) {
        doc.fillColor(darkGray).fontSize(10).font('Helvetica');
        doc.text('Descrição:', 60, currentY);
        doc.text(proposal.descricaoManutencao, 60, currentY + 15, { width: 500 });
        currentY += 35;
      }
      if (proposal.valorMensalManutencao) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Valor Mensal:', `R$ ${this.formatCurrency(proposal.valorMensalManutencao)}`, 250);
      }
      if (proposal.dataInicioManutencao) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Início:', this.formatDate(proposal.dataInicioManutencao), 250);
      }
      if (proposal.vencimentoManutencao) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Renovação:', this.formatDate(proposal.vencimentoManutencao), 250);
      }
      
      currentY += 10;
    }

    // CONTRATO FIXO
    if (proposal.serviceType === 'CONTRATO_FIXO') {
      currentY = this.drawSectionContainer(doc, currentY, 'INFORMAÇÕES DE CONTRATO FIXO', secondaryColor);
      currentY += 10;

      if (proposal.valorMensalFixo) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Valor Mensal:', `R$ ${this.formatCurrency(proposal.valorMensalFixo)}`, 250);
      }
      if (proposal.dataInicio) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Início:', this.formatDate(proposal.dataInicio), 250);
      }
      if (proposal.dataFimContrato) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Término:', this.formatDate(proposal.dataFimContrato), 250);
      }
      
      currentY += 10;
    }

    // MIGRAÇÃO DE DADOS
    if (proposal.sistemaOrigem || proposal.sistemaDestino) {
      currentY = this.drawSectionContainer(doc, currentY, 'MIGRAÇÃO DE DADOS', secondaryColor);
      currentY += 10;

      if (proposal.sistemaOrigem) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Sistema de Origem:', proposal.sistemaOrigem, 300);
      }
      if (proposal.sistemaDestino) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Sistema de Destino:', proposal.sistemaDestino, 300);
      }
      if (proposal.dataEntregaHomologacao) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Entrega da Homologação:', this.formatDate(proposal.dataEntregaHomologacao), 250);
      }
      if (proposal.dataEntregaProducao) {
        currentY = this.drawInfoRow(doc, 60, currentY, 'Data de Entrega da Produção:', this.formatDate(proposal.dataEntregaProducao), 250);
      }
      
      currentY += 10;
    }

    // Parcelas com tabela estilizada
    if (parcelas && parcelas.length > 0) {
      currentY = this.drawSectionContainer(doc, currentY, 'PARCELAS', green);
      currentY += 10;

      // Cabeçalho da tabela
      const tableHeaderY = currentY;
      doc.fillColor('#ffffff')
        .rect(60, tableHeaderY, 500, 20)
        .fill(secondaryColor);
      
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('Parcela', 70, tableHeaderY + 6);
      doc.text('Valor', 180, tableHeaderY + 6);
      doc.text('Faturamento', 300, tableHeaderY + 6);
      doc.text('Vencimento', 450, tableHeaderY + 6);
      
      currentY = tableHeaderY + 25;

      // Linhas da tabela
      doc.fontSize(9).font('Helvetica').fillColor(darkGray);
      parcelas.forEach((parcela, index) => {
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }

        // Linha zebrada
        if (index % 2 === 0) {
          doc.fillColor(lightGray)
            .rect(60, currentY - 2, 500, 18)
            .fill();
        }

        doc.fillColor(darkGray);
        doc.text(String(parcela.numero || index + 1), 70, currentY + 4);
        doc.fillColor(green).font('Helvetica-Bold');
        doc.text(`R$ ${this.formatCurrency(parcela.valor)}`, 180, currentY + 4);
        doc.fillColor(darkGray).font('Helvetica');
        if (parcela.dataFaturamento) {
          doc.text(this.formatDate(parcela.dataFaturamento), 300, currentY + 4);
        }
        if (parcela.dataVencimento) {
          doc.text(this.formatDate(parcela.dataVencimento), 450, currentY + 4);
        }
        
        currentY += 20;
      });

      // Borda da tabela
      doc.strokeColor(secondaryColor)
        .lineWidth(1)
        .rect(60, tableHeaderY, 500, currentY - tableHeaderY - 5)
        .stroke();

      currentY += 10;
    }

    // Se proposta está fechada, adicionar dados relacionados
    if (proposal.status === 'FECHADA') {
      // Projetos
      if (projects.length > 0) {
        currentY = this.drawSectionContainer(doc, currentY, 'PROJETOS RELACIONADOS', primaryColor);
        currentY += 10;

        projects.forEach((project, index) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }

          // Container de projeto
          const projectBoxY = currentY;
          doc.fillColor(lightGray)
            .roundedRect(60, projectBoxY, 500, 80, 5)
            .fill();
          
          doc.strokeColor(primaryColor)
            .lineWidth(1)
            .roundedRect(60, projectBoxY, 500, 80, 5)
            .stroke();

          doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold');
          doc.text(`${index + 1}. ${project.name}`, 70, projectBoxY + 10);
          
          doc.fillColor(darkGray).fontSize(9).font('Helvetica');
          if (project.description) {
            doc.text(`Descrição: ${project.description}`, 70, projectBoxY + 28, { width: 480 });
          }
          
          const statusY = projectBoxY + (project.description ? 45 : 28);
          doc.text(`Status: ${project.status || 'N/A'}`, 70, statusY);
          
          if (project.dataInicio) {
            doc.text(`Início: ${this.formatDate(project.dataInicio)}`, 200, statusY);
          }
          if (project.dataFim) {
            doc.text(`Conclusão: ${this.formatDate(project.dataFim)}`, 350, statusY);
          }
          
          // Tarefas do projeto
          if (project.tasks && project.tasks.length > 0) {
            doc.text(`Tarefas (${project.tasks.length}):`, 70, statusY + 15);
            project.tasks.slice(0, 2).forEach((task: ProjectTask, taskIndex: number) => {
              doc.text(`  • ${task.name} (${task.status || 'N/A'})`, 80, statusY + 28 + (taskIndex * 12), { width: 460 });
            });
            if (project.tasks.length > 2) {
              doc.text(`  ... e mais ${project.tasks.length - 2} tarefa(s)`, 80, statusY + 28 + (2 * 12), { width: 460 });
            }
          }

          currentY = projectBoxY + 90;
        });

        currentY += 10;
      }

      // Contas a Receber
      if (invoices.length > 0) {
        currentY = this.drawSectionContainer(doc, currentY, 'CONTAS A RECEBER', green);
        currentY += 10;

        // Cabeçalho da tabela
        const invoiceHeaderY = currentY;
        doc.fillColor('#ffffff')
          .rect(60, invoiceHeaderY, 500, 20)
          .fill(green);
        
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
        doc.text('Número', 70, invoiceHeaderY + 6);
        doc.text('Valor', 180, invoiceHeaderY + 6);
        doc.text('Emissão', 300, invoiceHeaderY + 6);
        doc.text('Vencimento', 400, invoiceHeaderY + 6);
        doc.text('Status', 500, invoiceHeaderY + 6);
        
        currentY = invoiceHeaderY + 25;

        // Linhas da tabela
        doc.fontSize(9).font('Helvetica').fillColor(darkGray);
        invoices.forEach((invoice, index) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }

          if (index % 2 === 0) {
            doc.fillColor(lightGray)
              .rect(60, currentY - 2, 500, 18)
              .fill();
          }

          doc.fillColor(darkGray);
          doc.text(invoice.invoiceNumber || 'N/A', 70, currentY + 4);
          doc.fillColor(green).font('Helvetica-Bold');
          doc.text(`R$ ${this.formatCurrency(invoice.grossValue)}`, 180, currentY + 4);
          doc.fillColor(darkGray).font('Helvetica');
          doc.text(this.formatDate(invoice.emissionDate), 300, currentY + 4);
          doc.text(this.formatDate(invoice.dueDate), 400, currentY + 4);
          doc.text(invoice.status || 'N/A', 500, currentY + 4);
          
          currentY += 20;
        });

        // Borda da tabela
        doc.strokeColor(green)
          .lineWidth(1)
          .rect(60, invoiceHeaderY, 500, currentY - invoiceHeaderY - 5)
          .stroke();

        currentY += 10;
      }

      // Horas Trabalhadas
      if (timeEntries.length > 0) {
        currentY = this.drawSectionContainer(doc, currentY, 'HORAS TRABALHADAS', orange);
        currentY += 10;

        const totalHoras = timeEntries.reduce((sum, entry) => {
          const horas = typeof entry.horas === 'number' ? entry.horas : parseFloat(String(entry.horas)) || 0;
          return sum + horas;
        }, 0);
        
        doc.fillColor(orange).fontSize(11).font('Helvetica-Bold');
        doc.text(`Total de Horas: ${totalHoras.toFixed(2)}h`, 60, currentY);
        currentY += 20;

        // Cabeçalho da tabela
        const timeHeaderY = currentY;
        doc.fillColor('#ffffff')
          .rect(60, timeHeaderY, 500, 20)
          .fill(orange);
        
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
        doc.text('Data', 70, timeHeaderY + 6);
        doc.text('Horas', 130, timeHeaderY + 6);
        doc.text('Usuário', 180, timeHeaderY + 6);
        doc.text('Projeto', 280, timeHeaderY + 6);
        doc.text('Tarefa', 400, timeHeaderY + 6);
        doc.text('Status', 500, timeHeaderY + 6);
        
        currentY = timeHeaderY + 25;

        // Linhas da tabela
        doc.fontSize(8).font('Helvetica').fillColor(darkGray);
        timeEntries.forEach((entry, index) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 50;
          }

          if (index % 2 === 0) {
            doc.fillColor(lightGray)
              .rect(60, currentY - 2, 500, 18)
              .fill();
          }

          doc.fillColor(darkGray);
          doc.text(this.formatDate(entry.data), 70, currentY + 4);
          const horas = typeof entry.horas === 'number' ? entry.horas : parseFloat(String(entry.horas)) || 0;
          doc.text(`${horas.toFixed(2)}h`, 130, currentY + 4);
          doc.text(entry.user?.name || 'N/A', 180, currentY + 4, { width: 90, ellipsis: true });
          doc.text(entry.project?.name || 'N/A', 280, currentY + 4, { width: 110, ellipsis: true });
          doc.text(entry.task?.name || 'N/A', 400, currentY + 4, { width: 90, ellipsis: true });
          doc.text(entry.status || 'PENDENTE', 500, currentY + 4);
          
          currentY += 20;
        });

        // Borda da tabela
        doc.strokeColor(orange)
          .lineWidth(1)
          .rect(60, timeHeaderY, 500, currentY - timeHeaderY - 5)
          .stroke();
      }
    }

    // Rodapé com numeração de páginas (corrigido)
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc.fillColor(darkGray)
        .fontSize(8)
        .font('Helvetica');
      
      doc.text(
        `Página ${i + 1} de ${pageCount}`,
        40,
        doc.page.height - 30,
        { align: 'center', width: doc.page.width - 80 }
      );
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
    });
  }

  private drawSectionContainer(doc: any, y: number, title: string, color: string): number {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }

    // Container com cor
    const containerHeight = 25;
    doc.fillColor(color)
      .roundedRect(50, y, 510, containerHeight, 5)
      .fill();
    
    // Título
    doc.fillColor('#ffffff')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(title, 60, y + 7);
    
    return y + containerHeight + 10;
  }

  private drawInfoRow(doc: any, x: number, y: number, label: string, value: string, labelWidth: number = 150): number {
    doc.fillColor('#6b7280').fontSize(9).font('Helvetica');
    doc.text(label, x, y, { width: labelWidth });
    
    doc.fillColor('#1f2937').fontSize(10).font('Helvetica');
    doc.text(value, x + labelWidth + 10, y, { width: 400 - labelWidth });
    
    return y + 18;
  }

  private drawInfoRowWithColor(doc: any, x: number, y: number, label: string, value: string, color: string, labelWidth: number = 150): number {
    doc.fillColor('#6b7280').fontSize(9).font('Helvetica');
    doc.text(label, x, y, { width: labelWidth });
    
    doc.fillColor(color).fontSize(10).font('Helvetica-Bold');
    doc.text(value, x + labelWidth + 10, y, { width: 400 - labelWidth });
    
    return y + 18;
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      RASCUNHO: '#6b7280',
      ENVIADA: '#3b82f6',
      RE_ENVIADA: '#3b82f6',
      REVISADA: '#f59e0b',
      FECHADA: '#10b981',
      DECLINADA: '#ef4444',
      CANCELADA: '#ef4444',
    };
    return colors[status] || '#6b7280';
  }

  private formatCurrency(value: number | string): string {
    if (value === undefined || value === null) return '0,00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0,00';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('pt-BR');
  }

  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      RASCUNHO: 'Rascunho',
      ENVIADA: 'Enviada',
      RE_ENVIADA: 'Re-enviada',
      REVISADA: 'Revisada',
      FECHADA: 'Fechada',
      DECLINADA: 'Declinada',
      CANCELADA: 'Cancelada',
    };
    return labels[status] || status;
  }
}
