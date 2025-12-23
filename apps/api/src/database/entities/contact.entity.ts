import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './company.entity';
import { Client } from './client.entity';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'client_id', nullable: true })
  clientId?: string;

  @ManyToOne(() => Client, client => client.contacts, { nullable: true })
  @JoinColumn({ name: 'client_id' })
  client?: Client;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'phone', nullable: true })
  phone?: string;

  @Column({ name: 'email', nullable: true })
  email?: string;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}
