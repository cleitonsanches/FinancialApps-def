import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ProjectTemplate } from './project-template.entity';
import { ProjectTemplatePhase } from './project-template-phase.entity';

@Entity('project_template_tasks')
@Index('IX_project_template_tasks_template_id', ['templateId'])
@Index('IX_project_template_tasks_phase_id', ['phaseId'])
export class ProjectTemplateTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => ProjectTemplate, template => template.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: ProjectTemplate;

  @Column({ name: 'phase_id', nullable: true })
  phaseId?: string;

  @ManyToOne(() => ProjectTemplatePhase, phase => phase.tasks, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'phase_id' })
  phase?: ProjectTemplatePhase;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'duracao_prevista_dias', type: 'integer' })
  duracaoPrevistaDias: number;

  @Column({ name: 'dias_apos_inicio_projeto', type: 'integer', nullable: true })
  diasAposInicioProjeto?: number;

  @Column({ name: 'tarefa_anterior_id', nullable: true })
  tarefaAnteriorId?: string;

  @ManyToOne(() => ProjectTemplateTask, { nullable: true })
  @JoinColumn({ name: 'tarefa_anterior_id' })
  tarefaAnterior?: ProjectTemplateTask;

  @Column({ name: 'ordem', type: 'integer', default: 0 })
  ordem: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

