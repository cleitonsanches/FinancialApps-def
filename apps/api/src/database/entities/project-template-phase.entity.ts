import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ProjectTemplate } from './project-template.entity';
import { ProjectTemplateTask } from './project-template-task.entity';

/**
 * Entidade ProjectTemplatePhase (Fase de Template de Projeto)
 * 
 * Representa uma fase dentro de um template de projeto.
 * Hierarquia: Template > Fase > Atividade
 * 
 * Cada template pode ter múltiplas fases, e cada fase pode ter múltiplas atividades (tasks).
 */
@Entity('project_template_phases')
@Index('IX_project_template_phases_template_id', ['templateId'])
export class ProjectTemplatePhase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => ProjectTemplate, template => template.phases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: ProjectTemplate;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'ordem', type: 'integer', default: 0 })
  ordem: number; // Ordem de exibição da fase no template

  @OneToMany(() => ProjectTemplateTask, task => task.phase, { cascade: true })
  tasks?: ProjectTemplateTask[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

