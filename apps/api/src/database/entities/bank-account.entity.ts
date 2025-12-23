import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './company.entity';

@Entity('bank_accounts')
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'bank_name', type: 'varchar', length: 200 })
  bankName: string;

  @Column({ name: 'agency', type: 'varchar', length: 20, nullable: true })
  agency?: string;

  @Column({ name: 'account_number', type: 'varchar', length: 50 })
  accountNumber: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20, nullable: true })
  accountType?: string;

  @Column({ name: 'balance', type: 'decimal', precision: 15, scale: 2, default: 0 })
  balance: number;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}

