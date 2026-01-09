import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';

@Entity('bank_accounts')
@Index('IX_bank_accounts_company_id', ['companyId'])
export class BankAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'bank_name', type: 'varchar', length: 255 })
  bankName: string;

  @Column({ name: 'account_number', type: 'varchar', length: 50 })
  accountNumber: string;

  @Column({ name: 'agency', type: 'varchar', length: 20, nullable: true })
  agency?: string;

  @Column({ name: 'account_type', type: 'varchar', length: 20, nullable: true })
  accountType?: string; // CORRENTE, POUPANCA, etc.

  // Temporariamente comentado até a migração ser executada
  // Execute: npm run migrate:pix-key na pasta apps/api
  // @Column({ name: 'pix_key', type: 'varchar', length: 255, nullable: true })
  // pixKey?: string;

  @Column({ name: 'saldo_inicial', type: 'decimal', precision: 15, scale: 2, default: 0 })
  saldoInicial: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'ATIVA' })
  status: string; // ATIVA, INATIVA

  @Column({ name: 'is_padrao', type: 'bit', default: false })
  isPadrao: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

