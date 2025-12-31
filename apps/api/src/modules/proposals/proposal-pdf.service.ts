import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { Proposal } from '../../database/entities/proposal.entity';
import { Project, ProjectTask } from '../../database/entities/project.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';

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

  async generatePdf(proposalId: string): Promise<Buffer> {
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
    const doc = new (PDFDocument as any)({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {});

    // Cabeçalho
    doc.fontSize(20).font('Helvetica-Bold');
    doc.text('PRECISION DADOS & SOLUÇÕES', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(16).font('Helvetica');
    doc.text('PROPOSTA COMERCIAL', { align: 'center' });
    doc.moveDown(1);

    // Informações da Proposta
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('DADOS DA PROPOSTA', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica');
    let y = doc.y;
    doc.text(`Número: ${proposal.numero || 'N/A'}`, 50, y);
    y += 15;
    doc.text(`Status: ${this.getStatusLabel(proposal.status)}`, 50, y);
    y += 15;
    doc.text(`Cliente: ${proposal.client?.razaoSocial || proposal.client?.name || 'N/A'}`, 50, y);
    y += 15;
    if (proposal.client?.cnpjCpf) {
      doc.text(`CNPJ/CPF: ${proposal.client.cnpjCpf}`, 50, y);
      y += 15;
    }
    doc.text(`Título: ${proposal.title || 'N/A'}`, 50, y);
    y += 15;
    if (proposal.serviceType) {
      doc.text(`Tipo de Serviço: ${proposal.serviceType}`, 50, y);
      y += 15;
    }
    if (proposal.tipoContratacao) {
      doc.text(`Tipo de Contratação: ${proposal.tipoContratacao}`, 50, y);
      y += 15;
    }
    if (proposal.valorProposta) {
      doc.text(`Valor da Proposta: R$ ${this.formatCurrency(proposal.valorProposta)}`, 50, y);
      y += 15;
    }
    if (proposal.valorPorHora) {
      doc.text(`Valor por Hora: R$ ${this.formatCurrency(proposal.valorPorHora)}`, 50, y);
      y += 15;
    }
    if (proposal.horasEstimadas) {
      doc.text(`Horas Estimadas: ${proposal.horasEstimadas}h`, 50, y);
      y += 15;
    }
    if (proposal.dataInicio) {
      doc.text(`Data de Início: ${this.formatDate(proposal.dataInicio)}`, 50, y);
      y += 15;
    }
    if (proposal.previsaoConclusao) {
      doc.text(`Previsão de Conclusão: ${this.formatDate(proposal.previsaoConclusao)}`, 50, y);
      y += 15;
    }
    if (proposal.inicioFaturamento) {
      doc.text(`Início do Faturamento: ${this.formatDate(proposal.inicioFaturamento)}`, 50, y);
      y += 15;
    }
    if (proposal.dataFaturamento) {
      doc.text(`Data do Faturamento: ${this.formatDate(proposal.dataFaturamento)}`, 50, y);
      y += 15;
    }
    if (proposal.dataVencimento) {
      doc.text(`Data de Vencimento: ${this.formatDate(proposal.dataVencimento)}`, 50, y);
      y += 15;
    }

    doc.moveDown(1);
    doc.y = y + 10;

    // Campos específicos por tipo de serviço
    if (proposal.sistemaOrigem || proposal.sistemaDestino) {
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('MIGRAÇÃO DE DADOS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      y = doc.y;
      if (proposal.sistemaOrigem) {
        doc.text(`Sistema de Origem: ${proposal.sistemaOrigem}`, 50, y);
        y += 15;
      }
      if (proposal.sistemaDestino) {
        doc.text(`Sistema de Destino: ${proposal.sistemaDestino}`, 50, y);
        y += 15;
      }
      if (proposal.dataEntregaHomologacao) {
        doc.text(`Data de Entrega da Homologação: ${this.formatDate(proposal.dataEntregaHomologacao)}`, 50, y);
        y += 15;
      }
      if (proposal.dataEntregaProducao) {
        doc.text(`Data de Entrega da Produção: ${this.formatDate(proposal.dataEntregaProducao)}`, 50, y);
        y += 15;
      }
      doc.moveDown(1);
      doc.y = y + 10;
    }

    // Parcelas
    if (parcelas && parcelas.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('PARCELAS', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(9).font('Helvetica-Bold');
      let parcelTableY = doc.y;
      doc.text('Parcela', 50, parcelTableY);
      doc.text('Valor', 150, parcelTableY);
      doc.text('Faturamento', 250, parcelTableY);
      doc.text('Vencimento', 380, parcelTableY);
      parcelTableY += 15;
      
      doc.fontSize(9).font('Helvetica');
      parcelas.forEach((parcela, index) => {
        if (parcelTableY > 700) {
          doc.addPage();
          parcelTableY = 50;
        }
        doc.text(String(parcela.numero || index + 1), 50, parcelTableY);
        doc.text(`R$ ${this.formatCurrency(parcela.valor)}`, 150, parcelTableY);
        if (parcela.dataFaturamento) {
          doc.text(this.formatDate(parcela.dataFaturamento), 250, parcelTableY);
        }
        if (parcela.dataVencimento) {
          doc.text(this.formatDate(parcela.dataVencimento), 380, parcelTableY);
        }
        parcelTableY += 15;
      });
      
      doc.y = parcelTableY + 10;
      doc.moveDown(1);
    }

    // Se proposta está fechada, adicionar dados relacionados
    if (proposal.status === 'FECHADA') {
      // Projetos
      if (projects.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('PROJETOS RELACIONADOS', { underline: true });
        doc.moveDown(0.5);
        
        projects.forEach((project, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }
          doc.fontSize(10).font('Helvetica-Bold');
          doc.text(`${index + 1}. ${project.name}`, 50, doc.y);
          doc.moveDown(0.3);
          doc.fontSize(9).font('Helvetica');
          if (project.description) {
            doc.text(`Descrição: ${project.description}`, 70, doc.y);
            doc.moveDown(0.3);
          }
          doc.text(`Status: ${project.status || 'N/A'}`, 70, doc.y);
          doc.moveDown(0.3);
          if (project.dataInicio) {
            doc.text(`Data de Início: ${this.formatDate(project.dataInicio)}`, 70, doc.y);
            doc.moveDown(0.3);
          }
          if (project.dataFim) {
            doc.text(`Data de Conclusão: ${this.formatDate(project.dataFim)}`, 70, doc.y);
            doc.moveDown(0.3);
          }
          
          // Tarefas do projeto
          if (project.tasks && project.tasks.length > 0) {
            doc.text(`Tarefas (${project.tasks.length}):`, 70, doc.y);
            doc.moveDown(0.3);
            project.tasks.forEach((task: ProjectTask) => {
              doc.text(`  - ${task.name} (${task.status || 'N/A'})`, 90, doc.y);
              doc.moveDown(0.2);
            });
          }
          
          doc.moveDown(0.5);
        });
      }

      // Invoices
      if (invoices.length > 0) {
        if (doc.y > 700) {
          doc.addPage();
        }
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('CONTAS A RECEBER', { underline: true });
        doc.moveDown(0.5);
        
        doc.fontSize(9).font('Helvetica-Bold');
        let invoiceTableY = doc.y;
        doc.text('Número', 50, invoiceTableY);
        doc.text('Valor', 150, invoiceTableY);
        doc.text('Emissão', 250, invoiceTableY);
        doc.text('Vencimento', 380, invoiceTableY);
        doc.text('Status', 480, invoiceTableY);
        invoiceTableY += 15;
        
        doc.fontSize(9).font('Helvetica');
        invoices.forEach((invoice) => {
          if (invoiceTableY > 700) {
            doc.addPage();
            invoiceTableY = 50;
          }
          doc.text(invoice.invoiceNumber || 'N/A', 50, invoiceTableY);
          doc.text(`R$ ${this.formatCurrency(invoice.grossValue)}`, 150, invoiceTableY);
          doc.text(this.formatDate(invoice.emissionDate), 250, invoiceTableY);
          doc.text(this.formatDate(invoice.dueDate), 380, invoiceTableY);
          doc.text(invoice.status || 'N/A', 480, invoiceTableY);
          invoiceTableY += 15;
        });
        
        doc.y = invoiceTableY + 10;
      }

      // Horas Trabalhadas
      if (timeEntries.length > 0) {
        if (doc.y > 700) {
          doc.addPage();
        }
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('HORAS TRABALHADAS', { underline: true });
        doc.moveDown(0.5);
        
        const totalHoras = timeEntries.reduce((sum, entry) => {
          const horas = typeof entry.horas === 'number' ? entry.horas : parseFloat(String(entry.horas)) || 0;
          return sum + horas;
        }, 0);
        
        doc.fontSize(10).font('Helvetica');
        doc.text(`Total de Horas: ${totalHoras.toFixed(2)}h`, 50, doc.y);
        doc.moveDown(0.5);
        
        doc.fontSize(9).font('Helvetica-Bold');
        let timeTableY = doc.y;
        doc.text('Data', 50, timeTableY);
        doc.text('Horas', 120, timeTableY);
        doc.text('Usuário', 180, timeTableY);
        doc.text('Projeto', 280, timeTableY);
        doc.text('Tarefa', 400, timeTableY);
        doc.text('Status', 480, timeTableY);
        timeTableY += 15;
        
        doc.fontSize(9).font('Helvetica');
        timeEntries.forEach((entry) => {
          if (timeTableY > 700) {
            doc.addPage();
            timeTableY = 50;
          }
          doc.text(this.formatDate(entry.data), 50, timeTableY);
          const horas = typeof entry.horas === 'number' ? entry.horas : parseFloat(String(entry.horas)) || 0;
          doc.text(`${horas.toFixed(2)}h`, 120, timeTableY);
          doc.text(entry.user?.name || 'N/A', 180, timeTableY);
          doc.text(entry.project?.name || 'N/A', 280, timeTableY);
          doc.text(entry.task?.name || 'N/A', 400, timeTableY);
          doc.text(entry.status || 'PENDENTE', 480, timeTableY);
          timeTableY += 15;
        });
      }
    }

    // Rodapé
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `Página ${i + 1} de ${pageCount}`,
        50,
        doc.page.height - 30,
        { align: 'center' }
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

  private formatCurrency(value: number | string): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
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

