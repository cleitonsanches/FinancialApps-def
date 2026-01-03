import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { ProjectTask } from './project.entity';
import { User } from './user.entity';

@Entity('task_comments')
@Index('IX_task_comments_task_id', ['taskId'])
@Index('IX_task_comments_user_id', ['userId'])
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  taskId: string;

  @ManyToOne(() => ProjectTask, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: ProjectTask;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'texto', type: 'text' })
  texto: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

