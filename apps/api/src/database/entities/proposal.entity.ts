import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { Client } from './client.entity';
import { User } from './user.entity';

@Entity('proposals')
@Index('IX_proposals_company_id', ['companyId'])
@Index('IX_proposals_client_id', ['clientId'])
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'RASCUNHO' })
  status: string; // RASCUNHO, ENVIADA, RE_ENVIADA, REVISADA, FECHADA, DECLINADA, CANCELADA

  @Column({ name: 'tipo_contratacao', type: 'varchar', length: 50, nullable: true })
  tipoContratacao?: string;

  @Column({ name: 'tipo_faturamento', type: 'varchar', length: 50, nullable: true })
  tipoFaturamento?: string;

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio?: Date;

  @Column({ name: 'valor_total', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorTotal?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

