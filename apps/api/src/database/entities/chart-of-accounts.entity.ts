import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './company.entity';

@Entity('chart_of_accounts')
export class ChartOfAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'code', type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'type', type: 'varchar', length: 20 })
  type: 'RECEITA' | 'DESPESA' | 'REEMBOLSO';

  @Column({ name: 'center_cost', type: 'varchar', length: 100, nullable: true })
  centerCost?: string;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}

