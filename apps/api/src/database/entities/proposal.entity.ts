import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { Client } from './client.entity';
import { User } from './user.entity';

@Entity('proposals')
@Index('IX_proposals_company_id', ['companyId'])
@Index('IX_proposals_client_id', ['clientId'])
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

  @Column({ name: 'numero', type: 'varchar', length: 50, nullable: true })
  numero?: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'RASCUNHO' })
  status: string; // RASCUNHO, ENVIADA, RE_ENVIADA, REVISADA, FECHADA, DECLINADA, CANCELADA

  @Column({ name: 'service_type', type: 'varchar', length: 100, nullable: true })
  serviceType?: string;

  @Column({ name: 'tipo_contratacao', type: 'varchar', length: 50, nullable: true })
  tipoContratacao?: string;

  @Column({ name: 'tipo_faturamento', type: 'varchar', length: 50, nullable: true })
  tipoFaturamento?: string;

  @Column({ name: 'forma_faturamento', type: 'varchar', length: 50, nullable: true })
  formaFaturamento?: string;

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio?: Date;

  @Column({ name: 'valor_total', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorTotal?: number;

  @Column({ name: 'valor_proposta', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorProposta?: number;

  @Column({ name: 'valor_por_hora', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorPorHora?: number;

  @Column({ name: 'horas_estimadas', type: 'varchar', length: 20, nullable: true })
  horasEstimadas?: string;

  @Column({ name: 'previsao_conclusao', type: 'date', nullable: true })
  previsaoConclusao?: Date;

  @Column({ name: 'inicio_faturamento', type: 'date', nullable: true })
  inicioFaturamento?: Date;

  @Column({ name: 'vencimento', type: 'date', nullable: true })
  vencimento?: Date;

  // Campos específicos para Migração de Dados
  @Column({ name: 'sistema_origem', type: 'varchar', length: 255, nullable: true })
  sistemaOrigem?: string;

  @Column({ name: 'sistema_destino', type: 'varchar', length: 255, nullable: true })
  sistemaDestino?: string;

  @Column({ name: 'data_entrega_homologacao', type: 'date', nullable: true })
  dataEntregaHomologacao?: Date;

  @Column({ name: 'data_entrega_producao', type: 'date', nullable: true })
  dataEntregaProducao?: Date;

  @Column({ name: 'data_inicio_trabalho', type: 'date', nullable: true })
  dataInicioTrabalho?: Date;

  @Column({ name: 'data_faturamento', type: 'date', nullable: true })
  dataFaturamento?: Date;

  @Column({ name: 'data_vencimento', type: 'date', nullable: true })
  dataVencimento?: Date;

  // Datas de mudança de status
  @Column({ name: 'data_envio', type: 'date', nullable: true })
  dataEnvio?: Date;

  @Column({ name: 'data_re_envio', type: 'date', nullable: true })
  dataReEnvio?: Date;

  @Column({ name: 'data_revisao', type: 'date', nullable: true })
  dataRevisao?: Date;

  @Column({ name: 'data_fechamento', type: 'date', nullable: true })
  dataFechamento?: Date;

  @Column({ name: 'data_declinio', type: 'date', nullable: true })
  dataDeclinio?: Date;

  @Column({ name: 'data_cancelamento', type: 'date', nullable: true })
  dataCancelamento?: Date;

  @Column({ name: 'parcelas', type: 'text', nullable: true })
  parcelas?: string;

  @Column({ name: 'motivo_cancelamento', type: 'text', nullable: true })
  motivoCancelamento?: string;

  @Column({ name: 'motivo_declinio', type: 'text', nullable: true })
  motivoDeclinio?: string; // JSON string com array de parcelas

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

