import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './company.entity';

@Entity('proposal_templates')
export class ProposalTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'nome', type: 'varchar', length: 200 })
  nome: string;

  @Column({ name: 'tipo_servico', type: 'varchar', length: 50 })
  tipoServico: string; // AUTOMACOES, CONSULTORIA, TREINAMENTO, etc.

  @Column({ name: 'descricao', type: 'text', nullable: true })
  descricao?: string;

  // Configuração JSON dos campos visíveis/obrigatórios
  // Formato: { "campo": { "visivel": true, "obrigatorio": false, "valorPadrao": null } }
  @Column({ name: 'configuracao_campos', type: 'text', nullable: true })
  configuracaoCampos?: string; // JSON string

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

