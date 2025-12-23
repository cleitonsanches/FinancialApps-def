import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceTax } from '../../database/entities/invoice.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceTax)
    private invoiceTaxRepository: Repository<InvoiceTax>,
  ) {}

  async findAll(companyId?: string): Promise<Invoice[]> {
    if (companyId) {
      return this.invoiceRepository.find({ 
        where: { companyId },
        relations: ['client', 'proposal'],
      });
    }
    return this.invoiceRepository.find({ relations: ['client', 'proposal'] });
  }

  async findOne(id: string): Promise<Invoice> {
    return this.invoiceRepository.findOne({ 
      where: { id },
      relations: ['client', 'proposal', 'taxes'],
    });
  }

  async create(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoiceRepository.create(invoiceData);
    return this.invoiceRepository.save(invoice);
  }

  async update(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    await this.invoiceRepository.update(id, invoiceData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.invoiceRepository.delete(id);
  }

  async createFromProposalParcels(proposalId: string, parcels: any[], companyId: string) {
    if (!parcels || parcels.length === 0) {
      throw new BadRequestException('Nenhuma parcela fornecida para criação de contas a receber.');
    }

    const invoicesToCreate = parcels.map(parcel => {
      const invoiceNumber = `NEG-${proposalId.substring(0, 4)}-${parcel.numero}`;
      return this.invoiceRepository.create({
        companyId,
        clientId: parcel.clientId,
        proposalId,
        invoiceNumber,
        emissionDate: new Date(),
        dueDate: new Date(parcel.dataVencimento),
        grossValue: parcel.valor,
        status: 'PROVISIONADA',
        origem: 'NEGOCIACAO',
      });
    });

    const savedInvoices = await this.invoiceRepository.save(invoicesToCreate);
    return Array.isArray(savedInvoices) ? savedInvoices : [savedInvoices];
  }
}

