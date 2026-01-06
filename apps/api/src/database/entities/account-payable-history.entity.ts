import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { AccountPayable } from './account-payable.entity';
import { User } from './user.entity';

@Entity('account_payable_history')
@Index('IX_account_payable_history_account_payable_id', ['accountPayableId'])
export class AccountPayableHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_payable_id' })
  accountPayableId: string;

  @ManyToOne(() => AccountPayable)
  @JoinColumn({ name: 'account_payable_id' })
  accountPayable: AccountPayable;

  @Column({ name: 'action', type: 'varchar', length: 50 })
  action: string; // 'EDIT', 'CANCEL', 'PAY', etc.

  @Column({ name: 'field_name', type: 'varchar', length: 100, nullable: true })
  fieldName?: string; // Nome do campo alterado (ex: 'totalValue', 'dueDate')

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


