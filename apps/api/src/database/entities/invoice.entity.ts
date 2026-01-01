import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { Client } from './client.entity';
import { Proposal } from './proposal.entity';
import { ChartOfAccounts } from './chart-of-accounts.entity';
import { BankAccount } from './bank-account.entity';

@Entity('invoices')
@Index('IX_invoices_company_id', ['companyId'])
@Index('IX_invoices_client_id', ['clientId'])
@Index('IX_invoices_due_date', ['dueDate'])
@Index('IX_invoices_status', ['status'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'invoice_number', type: 'varchar', length: 50 })
  invoiceNumber: string;

  @Column({ name: 'series', type: 'varchar', length: 10, nullable: true })
  series?: string;

  @Column({ name: 'emission_date', type: 'date' })
  emissionDate: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'gross_value', type: 'decimal', precision: 15, scale: 2 })
  grossValue: number;

  @Column({ name: 'calculation_base', type: 'decimal', precision: 15, scale: 2, nullable: true })
  calculationBase?: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'EMITIDA' })
  status: string; // EMITIDA, PROVISIONADA, RECEBIDA, CANCELADA

  @Column({ name: 'origem', type: 'varchar', length: 20, default: 'MANUAL' })
  origem: 'NEGOCIACAO' | 'TIMESHEET' | 'MANUAL';

  @Column({ name: 'proposal_id', nullable: true })
  proposalId?: string;

  @ManyToOne(() => Proposal, { nullable: true })
  @JoinColumn({ name: 'proposal_id' })
  proposal?: Proposal;

  @Column({ name: 'timesheet_id', nullable: true })
  timesheetId?: string; // ID do lançamento de horas trabalhadas (quando origem for TIMESHEET)

  @Column({ name: 'approved_time_entries', type: 'text', nullable: true })
  approvedTimeEntries?: string; // JSON array com IDs das horas aprovadas que compõem esta invoice

  @Column({ name: 'data_recebimento', type: 'date', nullable: true })
  dataRecebimento?: Date;

  @Column({ name: 'numero_nf', type: 'varchar', length: 50, nullable: true })
  numeroNF?: string;

  @Column({ name: 'tipo_emissao', type: 'varchar', length: 10, nullable: true })
  tipoEmissao?: 'NF' | 'EF'; // NF = Nota Fiscal, EF = Emissão Fiscal (sem NF)

  @Column({ name: 'desconto', type: 'decimal', precision: 15, scale: 2, default: 0 })
  desconto?: number;

  @Column({ name: 'acrescimo', type: 'decimal', precision: 15, scale: 2, default: 0 })
  acrescimo?: number;

  @Column({ name: 'conta_corrente_id', nullable: true })
  contaCorrenteId?: string;

  @ManyToOne(() => BankAccount, { nullable: true })
  @JoinColumn({ name: 'conta_corrente_id' })
  contaCorrente?: BankAccount;

  @Column({ name: 'chart_of_accounts_id', nullable: true })
  chartOfAccountsId?: string;

  @ManyToOne(() => ChartOfAccounts, { nullable: true })
  @JoinColumn({ name: 'chart_of_accounts_id' })
  chartOfAccounts?: ChartOfAccounts;

  @OneToMany(() => InvoiceTax, tax => tax.invoice, { cascade: true })
  taxes?: InvoiceTax[];

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}

@Entity('invoice_taxes')
export class InvoiceTax {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @ManyToOne(() => Invoice, invoice => invoice.taxes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'tax_type', type: 'varchar', length: 50 })
  taxType: string; // ICMS, IPI, PIS, COFINS, etc.

  @Column({ name: 'rate', type: 'decimal', precision: 5, scale: 2 })
  rate: number; // Percentual da taxa

  @Column({ name: 'provisioned_value', type: 'decimal', precision: 15, scale: 2 })
  provisionedValue: number;

  @Column({ name: 'expected_payment_date', type: 'date', nullable: true })
  expectedPaymentDate?: Date;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}

