import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { Client } from './client.entity';
import { ChartOfAccounts } from './chart-of-accounts.entity';
import { BankAccount } from './bank-account.entity';

@Entity('accounts_payable')
@Index('IX_accounts_payable_company_id', ['companyId'])
@Index('IX_accounts_payable_supplier_id', ['supplierId'])
@Index('IX_accounts_payable_status', ['status'])
@Index('IX_accounts_payable_due_date', ['dueDate'])
export class AccountPayable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'codigo', type: 'varchar', length: 50, nullable: true })
  codigo?: string;

  @Column({ name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Client;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'chart_of_accounts_id', nullable: true })
  chartOfAccountsId?: string;

  @ManyToOne(() => ChartOfAccounts, { nullable: true })
  @JoinColumn({ name: 'chart_of_accounts_id' })
  chartOfAccounts?: ChartOfAccounts;

  @Column({ name: 'emission_date', type: 'date' })
  emissionDate: Date;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: Date;

  @Column({ name: 'total_value', type: 'decimal', precision: 15, scale: 2 })
  totalValue: number;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'PROVISIONADA' })
  status: string; // PROVISIONADA, AGUARDANDO_PAGAMENTO, PAGA, CANCELADA

  @Column({ name: 'payment_date', type: 'date', nullable: true })
  paymentDate?: Date;

  @Column({ name: 'valor_pago', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorPago?: number;

  @Column({ name: 'bank_account_id', nullable: true })
  bankAccountId?: string;

  @ManyToOne(() => BankAccount, { nullable: true })
  @JoinColumn({ name: 'bank_account_id' })
  bankAccount?: BankAccount;

  @Column({ 
    name: 'is_reembolsavel', 
    type: 'tinyint', 
    default: 0,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: number) => value === 1 || value === true
    }
  })
  isReembolsavel: boolean;

  @Column({ name: 'valor_reembolsar', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorReembolsar?: number;

  @Column({ name: 'status_reembolso', type: 'varchar', length: 50, nullable: true })
  statusReembolso?: string; // PROVISIONADO, SOLICITADO, RECEBIDO

  @Column({ name: 'data_status_reembolso', type: 'date', nullable: true })
  dataStatusReembolso?: Date;

  @Column({ name: 'destinatario_fatura_reembolso_id', nullable: true })
  destinatarioFaturaReembolsoId?: string;

  @ManyToOne(() => Client, { nullable: true })
  @JoinColumn({ name: 'destinatario_fatura_reembolso_id' })
  destinatarioFaturaReembolso?: Client;

  // Relação com reembolsos será carregada quando necessário via query
  // @OneToMany(() => Reimbursement, reimbursement => reimbursement.accountPayable)
  // reimbursements?: Reimbursement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

