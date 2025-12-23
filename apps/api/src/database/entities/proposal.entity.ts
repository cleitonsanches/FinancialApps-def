import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { Client } from './client.entity';
import { User } from './user.entity';
import { ProposalTemplate } from './proposal-template.entity';

@Entity('proposals')
@Index('IX_proposals_numero_proposta', ['numeroProposta'], { unique: true })
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'client_id' })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  client: Client;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'numero_proposta', type: 'varchar', length: 50, unique: true })
  @Index({ unique: true })
  numeroProposta: string;

  @Column({ name: 'titulo', type: 'varchar', length: 200, nullable: true })
  titulo?: string;

  @Column({ name: 'valor_total', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorTotal?: number;

  @CreateDateColumn({ name: 'data_proposta' })
  dataProposta: Date;

  @Column({ name: 'data_validade', type: 'datetime', nullable: true })
  dataValidade?: Date;

  @Column({ name: 'data_condicionada_aceite', type: 'date', nullable: true })
  dataCondicionadaAceite?: Date; // Data limite para aceite das datas de início e conclusão

  @Column({ name: 'status', type: 'varchar', length: 30, default: 'RASCUNHO' })
  status: string; // RASCUNHO, ENVIADA, REVISADA, RE_ENVIADA, FECHADA, DECLINADA

  @Column({ name: 'template_proposta_id', nullable: true })
  templatePropostaId?: string;

  @ManyToOne(() => ProposalTemplate, { nullable: true })
  @JoinColumn({ name: 'template_proposta_id' })
  templateProposta?: ProposalTemplate;

  // Campos fixos da proposta
  @Column({ name: 'descricao_projeto', type: 'text', nullable: true })
  descricaoProjeto?: string;

  @Column({ name: 'valor_proposto', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorProposto?: number;

  @Column({ name: 'tipo_contratacao', type: 'varchar', length: 50, nullable: true })
  tipoContratacao?: string; // RECORRENTE_MENSAL, PACOTE_HORAS, PROJETO

  @Column({ name: 'tipo_faturamento', type: 'varchar', length: 50, nullable: true })
  tipoFaturamento?: string; // FIXO, POR_HORAS_TRABALHADAS

  @Column({ name: 'horas_estimadas', type: 'varchar', length: 10, nullable: true })
  horasEstimadas?: string; // formato hh:mm

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio?: Date;

  @Column({ name: 'data_conclusao', type: 'date', nullable: true })
  dataConclusao?: Date;

  @Column({ name: 'inicio_faturamento', type: 'date', nullable: true })
  inicioFaturamento?: Date;

  @Column({ name: 'fim_faturamento', type: 'date', nullable: true })
  fimFaturamento?: Date;

  @Column({ name: 'data_vencimento', type: 'date', nullable: true })
  dataVencimento?: Date;

  @Column({ name: 'condicao_pagamento', type: 'varchar', length: 20, nullable: true })
  condicaoPagamento?: string; // ONESHOT, PARCELADO

  @Column({ name: 'sistema_origem', type: 'varchar', length: 200, nullable: true })
  sistemaOrigem?: string;

  @Column({ name: 'sistema_destino', type: 'varchar', length: 200, nullable: true })
  sistemaDestino?: string;

  @Column({ name: 'produto', type: 'varchar', length: 100, nullable: true })
  produto?: string; // BI_EXPLORER, OUTROS

  @Column({ name: 'manutencoes', type: 'text', nullable: true })
  manutencoes?: string; // JSON array ou texto separado
}

