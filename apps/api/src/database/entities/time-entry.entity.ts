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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

