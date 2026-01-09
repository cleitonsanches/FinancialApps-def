import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Project } from './project.entity';
import { ProjectTask } from './project.entity';
import { Proposal } from './proposal.entity';
import { Client } from './client.entity';
import { User } from './user.entity';

@Entity('time_entries')
@Index('IX_time_entries_project_id', ['projectId'])
@Index('IX_time_entries_task_id', ['taskId'])
@Index('IX_time_entries_proposal_id', ['proposalId'])
@Index('IX_time_entries_client_id', ['clientId'])
export class TimeEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @Column({ name: 'task_id', nullable: true })
  taskId?: string;

  @ManyToOne(() => ProjectTask, { nullable: true })
  @JoinColumn({ name: 'task_id' })
  task?: ProjectTask;

  @Column({ name: 'proposal_id', nullable: true, select: false })
  proposalId?: string;

  @ManyToOne(() => Proposal, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'proposal_id' })
  proposal?: Proposal;

  @Column({ name: 'client_id', nullable: true, select: false })
  clientId?: string;

  @ManyToOne(() => Client, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'data', type: 'date' })
  data: Date;

  @Column({ name: 'horas', type: 'decimal', precision: 10, scale: 2 })
  horas: number;

  @Column({ name: 'descricao', type: 'text', nullable: true })
  descricao?: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'PENDENTE' })
  status?: string; // PENDENTE, APROVADA, REPROVADA

  @Column({ name: 'motivo_reprovacao', type: 'text', nullable: true })
  motivoReprovacao?: string;

  @Column({ name: 'motivo_aprovacao', type: 'text', nullable: true })
  motivoAprovacao?: string;

  @Column({ 
    name: 'is_faturavel', 
    type: 'tinyint', 
    default: 0,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: number) => value === 1
    }
  })
  isFaturavel?: boolean;

  @Column({ name: 'valor_por_hora', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorPorHora?: number;

  @Column({ name: 'aprovado_por', nullable: true })
  aprovadoPor?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'aprovado_por' })
  aprovador?: User;

  @Column({ name: 'aprovado_em', type: 'datetime', nullable: true })
  aprovadoEm?: Date;

  @Column({ 
    name: 'faturamento_desprezado', 
    type: 'tinyint', 
    default: 0,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: number) => value === 1
    }
  })
  faturamentoDesprezado?: boolean;

  @Column({ name: 'reprovado_por', nullable: true })
  reprovadoPor?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reprovado_por' })
  reprovador?: User;

  @Column({ name: 'reprovado_em', type: 'datetime', nullable: true })
  reprovadoEm?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

