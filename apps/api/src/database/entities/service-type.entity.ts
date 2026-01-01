import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';

@Entity('service_types')
@Index('IX_service_types_company_id', ['companyId'])
@Index('IX_service_types_company_code', ['companyId', 'code'], { unique: true })
export class ServiceType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'code', type: 'varchar', length: 50 })
  code: string; // AUTOMACOES, CONSULTORIA, etc.

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string; // Automações, Consultoria, etc.

  @Column({ name: 'active', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

