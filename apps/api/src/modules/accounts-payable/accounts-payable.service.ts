import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountPayable } from '../../database/entities/account-payable.entity';
import { InvoiceAccountPayable } from '../../database/entities/invoice-account-payable.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { AccountPayableHistory } from '../../database/entities/account-payable-history.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class AccountsPayableService {
  constructor(
    @InjectRepository(AccountPayable)
    private accountPayableRepository: Repository<AccountPayable>,
    @InjectRepository(InvoiceAccountPayable)
    private invoiceAccountPayableRepository: Repository<InvoiceAccountPayable>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(AccountPayableHistory)
    private accountPayableHistoryRepository: Repository<AccountPayableHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(companyId?: string): Promise<AccountPayable[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    
    // Atualizar status automaticamente antes de retornar
    await this.updateStatusAutomatically(companyId);
    
    return this.accountPayableRepository.find({
      where,
      relations: ['supplier', 'chartOfAccounts', 'bankAccount', 'destinatarioFaturaReembolso'],
      order: { dueDate: 'ASC' },
    });
  }

  /**
   * Atualiza automaticamente o status das contas a pagar:
   * - 3 dias antes do vencimento: PROVISIONADA -> AGUARDANDO_PAGAMENTO
   */
  async updateStatusAutomatically(companyId?: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Data de 3 dias a partir de hoje
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);
    
    const where: any = {
      status: 'PROVISIONADA',
    };
    if (companyId) {
      where.companyId = companyId;
    }
    
    // Buscar contas provisionadas que estão a 3 dias ou menos do vencimento
    const accountsToUpdate = await this.accountPayableRepository.find({
      where,
    });
    
    let updatedCount = 0;
    for (const account of accountsToUpdate) {
      const dueDate = new Date(account.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      // Se a data de vencimento está entre hoje e 3 dias a partir de hoje
      if (dueDate >= today && dueDate <= threeDaysFromNow) {
        await this.accountPayableRepository.update(account.id, {
          status: 'AGUARDANDO_PAGAMENTO',
        });
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      console.log(`✅ ${updatedCount} conta(s) a pagar atualizada(s) para AGUARDANDO_PAGAMENTO`);
    }
  }

  async findOne(id: string): Promise<AccountPayable> {
    const accountPayable = await this.accountPayableRepository.findOne({
      where: { id },
      relations: ['supplier', 'chartOfAccounts', 'bankAccount', 'destinatarioFaturaReembolso'],
    });
    if (!accountPayable) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada`);
    }
    return accountPayable;
  }

  async create(accountPayableData: Partial<AccountPayable>): Promise<AccountPayable> {
    if (!accountPayableData.companyId) {
      throw new BadRequestException('companyId é obrigatório');
    }
    if (!accountPayableData.supplierId) {
      throw new BadRequestException('supplierId é obrigatório');
    }
    if (!accountPayableData.description) {
      throw new BadRequestException('description é obrigatório');
    }
    if (!accountPayableData.totalValue) {
      throw new BadRequestException('totalValue é obrigatório');
    }

    const accountPayable = this.accountPayableRepository.create({
      ...accountPayableData,
      status: accountPayableData.status || 'PROVISIONADA',
    });
    return this.accountPayableRepository.save(accountPayable);
  }

  async update(id: string, accountPayableData: Partial<AccountPayable>, userId?: string): Promise<AccountPayable> {
    // Buscar conta a pagar atual para verificar mudanças
    const existingAccountPayable = await this.accountPayableRepository.findOne({ where: { id } });
    
    if (!existingAccountPayable) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada`);
    }

    // Verificar se é cancelamento
    const isCancellation = accountPayableData.status === 'CANCELADA' && existingAccountPayable.status !== 'CANCELADA';
    // Verificar se é pagamento
    const isPayment = accountPayableData.status === 'PAGA' && existingAccountPayable.status !== 'PAGA';

    // Registrar histórico de alterações
    const changes: Array<{ field: string; old: any; new: any }> = [];
    
    // Comparar campos alterados
    const fieldsToTrack = [
      'totalValue', 'emissionDate', 'dueDate', 'description', 'chartOfAccountsId',
      'supplierId', 'status', 'paymentDate', 'bankAccountId', 'codigo'
    ];
    
    for (const field of fieldsToTrack) {
      if (accountPayableData[field] !== undefined && accountPayableData[field] !== existingAccountPayable[field]) {
        const oldVal = existingAccountPayable[field];
        const newVal = accountPayableData[field];
        changes.push({ field, old: oldVal, new: newVal });
      }
    }

    // Atualizar a conta a pagar
    await this.accountPayableRepository.update(id, accountPayableData);

    // Registrar histórico
    if (isCancellation) {
      await this.recordHistory(
        id,
        'CANCEL',
        userId,
        undefined,
        undefined,
        undefined,
        'Conta a pagar cancelada.',
      );
    } else if (isPayment) {
      // Registrar pagamento
      await this.recordHistory(
        id,
        'PAY',
        userId,
        'status',
        existingAccountPayable.status,
        'PAGA',
        `Conta a pagar marcada como paga${accountPayableData.paymentDate ? ` em ${accountPayableData.paymentDate}` : ''}`,
      );
      // Registrar outros campos alterados no pagamento (paymentDate, bankAccountId)
      for (const change of changes) {
        if (change.field !== 'status') {
          await this.recordHistory(
            id,
            'PAY',
            userId,
            change.field,
            change.old ? String(change.old) : null,
            change.new ? String(change.new) : null,
          );
        }
      }
    } else if (changes.length > 0) {
      // Registrar cada alteração
      for (const change of changes) {
        await this.recordHistory(
          id,
          'EDIT',
          userId,
          change.field,
          change.old ? String(change.old) : null,
          change.new ? String(change.new) : null,
        );
      }
    }

    return this.findOne(id);
  }

  /**
   * Registra uma entrada no histórico de alterações
   */
  async recordHistory(
    accountPayableId: string,
    action: string,
    userId?: string,
    fieldName?: string,
    oldValue?: string | null,
    newValue?: string | null,
    description?: string,
  ): Promise<AccountPayableHistory> {
    const { randomUUID } = await import('crypto');
    const history = this.accountPayableHistoryRepository.create({
      id: randomUUID(),
      accountPayableId,
      action,
      fieldName,
      oldValue: oldValue || null,
      newValue: newValue || null,
      description,
      changedBy: userId || null,
    });

    return this.accountPayableHistoryRepository.save(history);
  }

  /**
   * Busca o histórico de alterações de uma conta a pagar
   */
  async getHistory(accountPayableId: string): Promise<AccountPayableHistory[]> {
    return this.accountPayableHistoryRepository.find({
      where: { accountPayableId },
      relations: ['changedByUser'],
      order: { changedAt: 'DESC' },
    });
  }

  async delete(id: string): Promise<void> {
    const result = await this.accountPayableRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Conta a pagar com ID ${id} não encontrada`);
    }
  }

  /**
   * Busca todas as invoices relacionadas a uma conta a pagar (SIMPLES Nacional)
   */
  async findRelatedInvoices(accountPayableId: string): Promise<Array<{ invoice: Invoice; valorContribuido: number }>> {
    const relacionamentos = await this.invoiceAccountPayableRepository.find({
      where: { accountPayableId },
      relations: ['invoice', 'invoice.client'],
      order: { createdAt: 'ASC' },
    });

    return relacionamentos.map(rel => ({
      invoice: rel.invoice,
      valorContribuido: parseFloat(rel.valorContribuido.toString()),
    }));
  }
}

