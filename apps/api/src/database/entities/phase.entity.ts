import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Project } from './project.entity';
import { ProjectTask } from './project.entity';

/**
 * Entidade Phase (Fase)
 * 
 * Representa uma fase de produção dentro de um projeto.
 * Hierarquia: Negociação > Projeto > Fase > Atividade
 * 
 * Cada projeto pode ter múltiplas fases, e cada fase pode ter múltiplas atividades (tasks).
 * As fases permitem organizar o trabalho do projeto em etapas lógicas de produção.
 */
@Entity('phases')
@Index('IX_phases_project_id', ['projectId'])
export class Phase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, project => project.phases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'ordem', type: 'integer', default: 0 })
  ordem: number; // Ordem de exibição da fase no projeto

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio?: Date;

  @Column({ name: 'data_fim', type: 'date', nullable: true })
  dataFim?: Date;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'PENDENTE' })
  status: string; // PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA

  @OneToMany(() => ProjectTask, task => task.phase, { cascade: true })
  tasks?: ProjectTask[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

