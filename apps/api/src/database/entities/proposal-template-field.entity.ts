import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ProposalTemplate } from './proposal-template.entity';

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DECIMAL = 'DECIMAL',
  DATE = 'DATE',
  DATETIME = 'DATETIME',
  TIME = 'TIME',
  HOURS = 'HOURS', // Horas no formato hh:mm
  SELECT = 'SELECT',
  TEXTAREA = 'TEXTAREA',
  CHECKBOX = 'CHECKBOX',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  CURRENCY = 'CURRENCY',
}

@Entity('proposal_template_fields')
export class ProposalTemplateField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => ProposalTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: ProposalTemplate;

  @Column({ name: 'nome', type: 'varchar', length: 200 })
  nome: string; // Nome do campo (ex: "Valor Total", "Data de Entrega")

  @Column({ name: 'chave', type: 'varchar', length: 100 })
  chave: string; // Chave única do campo (ex: "valor_total", "data_entrega")

  @Column({ name: 'tipo', type: 'varchar', length: 50 })
  tipo: FieldType; // Tipo do campo

  @Column({ name: 'obrigatorio', type: 'boolean', default: false })
  obrigatorio: boolean;

  @Column({ name: 'ordem', type: 'integer', default: 0 })
  ordem: number; // Ordem de exibição

  @Column({ name: 'placeholder', type: 'varchar', length: 200, nullable: true })
  placeholder?: string;

  @Column({ name: 'descricao', type: 'text', nullable: true })
  descricao?: string; // Texto de ajuda

  @Column({ name: 'valor_padrao', type: 'text', nullable: true })
  valorPadrao?: string; // Valor padrão do campo

  // Para campos SELECT - opções em JSON
  @Column({ name: 'opcoes', type: 'text', nullable: true })
  opcoes?: string; // JSON array: ["Opção 1", "Opção 2"]

  // Validações em JSON
  @Column({ name: 'validacoes', type: 'text', nullable: true })
  validacoes?: string; // JSON: { min: 0, max: 100, pattern: "...", etc }

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt: Date;
}

