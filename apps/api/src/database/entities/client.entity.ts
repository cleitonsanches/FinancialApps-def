import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';

@Entity('clients')
@Index('IX_clients_company_id', ['companyId'])
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ name: 'razao_social', type: 'varchar', length: 255, nullable: true })
  razaoSocial?: string;

  @Column({ name: 'cnpj_cpf', type: 'varchar', length: 18, nullable: true })
  cnpjCpf?: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'address_street', type: 'varchar', length: 255, nullable: true })
  addressStreet?: string;

  @Column({ name: 'address_number', type: 'varchar', length: 20, nullable: true })
  addressNumber?: string;

  @Column({ name: 'address_complement', type: 'varchar', length: 255, nullable: true })
  addressComplement?: string;

  @Column({ name: 'address_neighborhood', type: 'varchar', length: 100, nullable: true })
  addressNeighborhood?: string;

  @Column({ name: 'address_city', type: 'varchar', length: 100, nullable: true })
  addressCity?: string;

  @Column({ name: 'address_state', type: 'varchar', length: 2, nullable: true })
  addressState?: string;

  @Column({ name: 'address_zipcode', type: 'varchar', length: 10, nullable: true })
  addressZipcode?: string;

  @Column({ 
    name: 'is_cliente', 
    type: 'tinyint', 
    default: 0,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: number) => value === 1
    }
  })
  isCliente: boolean;

  @Column({ 
    name: 'is_fornecedor', 
    type: 'tinyint', 
    default: 0,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: number) => value === 1
    }
  })
  isFornecedor: boolean;

  @Column({ 
    name: 'is_colaborador', 
    type: 'tinyint', 
    default: 0,
    transformer: {
      to: (value: boolean) => value ? 1 : 0,
      from: (value: number) => value === 1
    }
  })
  isColaborador: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

