import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Company } from './company.entity';
import { ProjectTemplateTask } from './project-template-task.entity';

@Entity('project_templates')
export class ProjectTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'service_type', type: 'varchar', length: 50 })
  serviceType: string; // AUTOMACOES, CONSULTORIA, TREINAMENTO, etc.

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => ProjectTemplateTask, task => task.template)
  tasks?: ProjectTemplateTask[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

