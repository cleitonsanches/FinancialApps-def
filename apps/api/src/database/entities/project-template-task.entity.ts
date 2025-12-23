import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProjectTemplate } from './project-template.entity';

@Entity('project_template_tasks')
export class ProjectTemplateTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => ProjectTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: ProjectTemplate;

  @Column({ name: 'name', type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'horas_estimadas', type: 'varchar', length: 10, nullable: true })
  horasEstimadas?: string; // formato hh:mm

  @Column({ name: 'duracao_prevista_dias', type: 'integer', nullable: true })
  duracaoPrevistaDias?: number; // Duração em dias (modo 1)

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio?: Date; // Data de início (modo 2)

  @Column({ name: 'data_conclusao', type: 'date', nullable: true })
  dataConclusao?: Date; // Data de conclusão (modo 2)

  @Column({ name: 'dias_apos_inicio_projeto', type: 'integer', nullable: true })
  diasAposInicioProjeto?: number; // Dias após início do projeto (para primeira tarefa)

  @Column({ name: 'dias_apos_tarefa_anterior', type: 'integer', nullable: true })
  diasAposTarefaAnterior?: number; // Dias após conclusão da tarefa anterior (para tarefas subsequentes)

  @Column({ name: 'tarefa_anterior_id', nullable: true })
  tarefaAnteriorId?: string; // ID da tarefa que deve ser concluída antes desta iniciar (interdependência)

  @ManyToOne(() => ProjectTemplateTask, { nullable: true })
  @JoinColumn({ name: 'tarefa_anterior_id' })
  tarefaAnterior?: ProjectTemplateTask;

  @Column({ name: 'responsavel_id', nullable: true })
  responsavelId?: string; // ID do usuário responsável (sempre um usuário)

  @Column({ name: 'executor_id', nullable: true })
  executorId?: string; // ID do executor (pode ser usuário ou contato)

  @Column({ name: 'executor_tipo', type: 'varchar', length: 20, nullable: true })
  executorTipo?: string; // 'USUARIO' ou 'CONTATO'

  @Column({ name: 'ordem', type: 'integer', default: 0 })
  ordem: number; // Ordem de execução das tarefas

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

