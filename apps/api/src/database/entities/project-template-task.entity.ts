import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProjectTemplate } from './project-template.entity';

@Entity('project_template_tasks')
export class ProjectTemplateTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => ProjectTemplate, template => template.tasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: ProjectTemplate;

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

