import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './company.entity';
import { ProjectTemplateTask } from './project-template-task.entity';
import { ProjectTemplatePhase } from './project-template-phase.entity';

@Entity('project_templates')
export class ProjectTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'service_type', type: 'varchar', length: 100, nullable: true })
  serviceType?: string;

  @OneToMany(() => ProjectTemplatePhase, phase => phase.template, { cascade: true })
  phases?: ProjectTemplatePhase[];

  @OneToMany(() => ProjectTemplateTask, task => task.template, { cascade: true })
  tasks?: ProjectTemplateTask[]; // Mantido para compatibilidade com templates antigos

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

