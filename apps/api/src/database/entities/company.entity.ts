import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'razao_social' })
  razaoSocial: string;

  @Column({ name: 'cnpj', nullable: true })
  cnpj?: string;

  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}

