import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { Client } from './client.entity';
import { Proposal } from './proposal.entity';
import { ProjectTemplate } from './project-template.entity';
import { User } from './user.entity';
import { Phase } from './phase.entity';

@Entity('projects')
@Index('IX_projects_company_id', ['companyId'])
@Index('IX_projects_proposal_id', ['proposalId'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'client_id', nullable: true })
  clientId?: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'proposal_id', nullable: true })
  proposalId?: string;

  @ManyToOne(() => Proposal, { nullable: true })
  @JoinColumn({ name: 'proposal_id' })
  proposal?: Proposal;

  @Column({ name: 'template_id', nullable: true })
  templateId?: string;

  @ManyToOne(() => ProjectTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template?: ProjectTemplate;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'service_type', type: 'varchar', length: 100, nullable: true })
  serviceType?: string;

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio?: Date;

  @Column({ name: 'data_fim', type: 'date', nullable: true })
  dataFim?: Date;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'PENDENTE' })
  status: string; // PENDENTE, EM_ANDAMENTO, CONCLUIDO, CANCELADA, NEGOCIACAO_CANCELADA

  @OneToMany(() => ProjectTask, task => task.project, { cascade: true })
  tasks?: ProjectTask[];

  @OneToMany(() => Phase, phase => phase.project, { cascade: true })
  phases?: Phase[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('project_tasks')
@Index('IX_project_tasks_project_id', ['projectId'])
@Index('IX_project_tasks_proposal_id', ['proposalId'])
@Index('IX_project_tasks_client_id', ['clientId'])
@Index('IX_project_tasks_phase_id', ['phaseId'])
export class ProjectTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @ManyToOne(() => Project, project => project.tasks, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project?: Project;

  @Column({ name: 'phase_id', nullable: true })
  phaseId?: string;

  @ManyToOne(() => Phase, phase => phase.tasks, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'phase_id' })
  phase?: Phase;

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

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio?: Date;

  @Column({ name: 'data_conclusao', type: 'date', nullable: true })
  dataConclusao?: Date;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'PENDENTE' })
  status: string; // PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA

  @Column({ name: 'ordem', type: 'integer', default: 0 })
  ordem: number;

  @Column({ name: 'usuario_responsavel_id', nullable: true })
  usuarioResponsavelId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_responsavel_id' })
  usuarioResponsavel?: User;

  @Column({ name: 'usuario_executor_id', nullable: true })
  usuarioExecutorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_executor_id' })
  usuarioExecutor?: User;

  @Column({ name: 'horas_estimadas', type: 'varchar', length: 20, nullable: true })
  horasEstimadas?: string;

  @Column({ name: 'tipo', type: 'varchar', length: 20, default: 'ATIVIDADE' })
  tipo?: string; // ATIVIDADE ou EVENTO

  @Column({ name: 'hora_inicio', type: 'varchar', length: 10, nullable: true })
  horaInicio?: string; // Para eventos: formato HH:MM

  @Column({ name: 'hora_fim', type: 'varchar', length: 10, nullable: true })
  horaFim?: string; // Para eventos: formato HH:MM

  @Column({ name: 'sem_prazo_definido', type: 'boolean', default: false })
  semPrazoDefinido?: boolean; // Para atividades: se true, só precisa dataInicio

  @Column({ name: 'dia_inteiro', type: 'boolean', default: false })
  diaInteiro?: boolean; // Para eventos: se true, oculta horários e trata como bloqueio de dia

  @Column({ name: 'exigir_lancamento_horas', type: 'boolean', default: false })
  exigirLancamentoHoras?: boolean; // Se true, exige lançamento de horas ao concluir

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

