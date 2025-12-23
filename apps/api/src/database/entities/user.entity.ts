import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './company.entity';
import { Contact } from './contact.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'email', unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'company_id', nullable: true })
  companyId: string;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'is_admin', default: false })
  isAdmin: boolean;

  @Column({ name: 'ativo', default: true })
  ativo: boolean;

  @Column({ name: 'contact_id', nullable: true })
  contactId?: string;

  @ManyToOne(() => Contact, { nullable: true })
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}

