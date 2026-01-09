import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './company.entity';
import { Contact } from './contact.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'company_id', nullable: true })
  companyId?: string;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @Column({ name: 'contact_id', nullable: true })
  contactId?: string;

  @ManyToOne(() => Contact, { nullable: true })
  @JoinColumn({ name: 'contact_id' })
  contact?: Contact;

  @Column({ 
    name: 'is_admin', 
    type: 'tinyint', 
    default: 0,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: number) => value === 1 || value === true
    }
  })
  isAdmin: boolean;

  @Column({ 
    name: 'is_active', 
    type: 'tinyint', 
    default: 1,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: number) => value === 1 || value === true
    }
  })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

