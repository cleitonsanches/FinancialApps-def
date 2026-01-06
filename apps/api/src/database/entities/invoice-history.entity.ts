import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Invoice } from './invoice.entity';
import { User } from './user.entity';

@Entity('invoice_history')
@Index('IX_invoice_history_invoice_id', ['invoiceId'])
export class InvoiceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invoice_id' })
  invoiceId: string;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column({ name: 'action', type: 'varchar', length: 50 })
  action: string; // 'EDIT', 'CANCEL', 'RECEIVE', etc.

  @Column({ name: 'field_name', type: 'varchar', length: 100, nullable: true })
  fieldName?: string; // Nome do campo alterado (ex: 'grossValue', 'dueDate')

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue?: string; // Valor anterior

  @Column({ name: 'new_value', type: 'text', nullable: true })
  newValue?: string; // Valor novo

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string; // Descrição da alteração

  @Column({ name: 'changed_by', nullable: true })
  changedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedByUser?: User;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}





