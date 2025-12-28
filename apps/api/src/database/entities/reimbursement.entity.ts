import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';
import { AccountPayable } from './account-payable.entity';
import { Invoice } from './invoice.entity';
import { ChartOfAccounts } from './chart-of-accounts.entity';

@Entity('reimbursements')
@Index('IX_reimbursements_company_id', ['companyId'])
@Index('IX_reimbursements_user_id', ['userId'])
@Index('IX_reimbursements_account_payable_id', ['accountPayableId'])
@Index('IX_reimbursements_invoice_id', ['invoiceId'])
@Index('IX_reimbursements_status', ['status'])
export class Reimbursement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'chart_of_accounts_id', nullable: true })
  chartOfAccountsId?: string;

  @ManyToOne(() => ChartOfAccounts, { nullable: true })
  @JoinColumn({ name: 'chart_of_accounts_id' })
  chartOfAccounts?: ChartOfAccounts;

  @Column({ name: 'expense_date', type: 'date' })
  expenseDate: Date;

  @Column({ name: 'amount', type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'SOLICITADO' })
  status: string; // SOLICITADO, APROVADO, PAGO, CANCELADO

  // Vinculação com Contas a Pagar (origem)
  @Column({ name: 'account_payable_id', type: 'varchar', length: 36, nullable: true })
  accountPayableId?: string;

  @ManyToOne(() => AccountPayable, { nullable: true })
  @JoinColumn({ name: 'account_payable_id' })
  accountPayable?: AccountPayable;

  // Vinculação com Contas a Receber (solicitação de reembolso pelo cliente)
  @Column({ name: 'invoice_id', type: 'varchar', length: 36, nullable: true })
  invoiceId?: string;

  @ManyToOne(() => Invoice, { nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: Invoice;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

