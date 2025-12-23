import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { Contact } from './contact.entity';

@Entity('clients')
@Index('IX_clients_cpf_cnpj', ['cpfCnpj'], { unique: true })
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'tipo_pessoa', type: 'varchar', length: 1 })
  tipoPessoa: 'F' | 'J'; // 'F' = Física, 'J' = Jurídica

  // Campos para Pessoa Jurídica (PJ)
  @Column({ name: 'razao_social', type: 'varchar', length: 200, nullable: true })
  razaoSocial?: string;

  @Column({ name: 'nome_fantasia', type: 'varchar', length: 200, nullable: true })
  nomeFantasia?: string;

  // Campo para Pessoa Física (PF)
  @Column({ name: 'nome_completo', type: 'varchar', length: 200, nullable: true })
  nomeCompleto?: string;

  @Column({ name: 'cpf_cnpj', type: 'varchar', length: 20, nullable: true })
  @Index({ unique: true })
  cpfCnpj?: string;

  // Contatos
  @Column({ name: 'email_principal', type: 'varchar', length: 200, nullable: true })
  emailPrincipal?: string;

  @Column({ name: 'telefone_principal', type: 'varchar', length: 30, nullable: true })
  telefonePrincipal?: string;

  @Column({ name: 'site', type: 'varchar', length: 200, nullable: true })
  site?: string;

  // Endereço completo
  @Column({ name: 'logradouro', type: 'varchar', length: 200, nullable: true })
  logradouro?: string;

  @Column({ name: 'numero', type: 'varchar', length: 20, nullable: true })
  numero?: string;

  @Column({ name: 'complemento', type: 'varchar', length: 100, nullable: true })
  complemento?: string;

  @Column({ name: 'bairro', type: 'varchar', length: 100, nullable: true })
  bairro?: string;

  @Column({ name: 'cidade', type: 'varchar', length: 100, nullable: true })
  cidade?: string;

  @Column({ name: 'uf', type: 'varchar', length: 2, nullable: true })
  uf?: string;

  @Column({ name: 'cep', type: 'varchar', length: 15, nullable: true })
  cep?: string;

  @Column({ name: 'pais', type: 'varchar', length: 100, nullable: true })
  pais?: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'ATIVO' })
  status: string;

  // Relacionamentos
  @OneToMany(() => Contact, contact => contact.client)
  contacts: Contact[];

  @CreateDateColumn({ name: 'data_cadastro', select: false })
  dataCadastro: Date;

  @UpdateDateColumn({ name: 'data_atualizacao', select: false })
  dataAtualizacao: Date;
}
