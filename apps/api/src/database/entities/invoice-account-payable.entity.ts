import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Invoice } from './invoice.entity';
import { AccountPayable } from './account-payable.entity';

/**
 * Entidade para relacionar Invoices com AccountPayable do SIMPLES Nacional
 * 
 * Armazena quais invoices contribuíram para o valor de uma conta a pagar do SIMPLES
 */
@Entity('invoice_account_payable')
@Index('IX_invoice_account_payable_invoice_id', ['invoiceId'])
@Index('IX_invoice_account_payable_account_payable_id', ['accountPayableId'])
export class InvoiceAccountPayable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'account_payable_id' })
  accountPayableId: string;

  @ManyToOne(() => AccountPayable)
  @JoinColumn({ name: 'account_payable_id' })
  accountPayable: AccountPayable;

  @Column({ name: 'valor_contribuido', type: 'decimal', precision: 15, scale: 2 })
  valorContribuido: number; // 6% do valor bruto da invoice

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}





