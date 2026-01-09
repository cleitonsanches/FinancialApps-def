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

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'RASCUNHO' })
  status: string; // RASCUNHO, ENVIADA, RE_ENVIADA, REVISADA, FECHADA, CONCLUIDA, DECLINADA, CANCELADA

  @Column({ name: 'tipo_contratacao', type: 'varchar', length: 50, nullable: true })
  tipoContratacao?: string;

  @Column({ name: 'tipo_faturamento', type: 'varchar', length: 50, nullable: true })
  tipoFaturamento?: string;

  @Column({ name: 'data_inicio', type: 'date', nullable: true })
  dataInicio?: Date;

  @Column({ name: 'valor_total', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorTotal?: number;

  // Campos adicionais
  @Column({ name: 'numero', type: 'varchar', length: 50, nullable: true })
  numero?: string;

  @Column({ name: 'service_type', type: 'varchar', length: 100, nullable: true })
  serviceType?: string;

  @Column({ name: 'valor_proposta', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorProposta?: number;

  @Column({ name: 'valor_por_hora', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorPorHora?: number;

  @Column({ name: 'forma_faturamento', type: 'varchar', length: 50, nullable: true })
  formaFaturamento?: string;

  @Column({ name: 'horas_estimadas', type: 'decimal', precision: 10, scale: 2, nullable: true })
  horasEstimadas?: number;

  @Column({ name: 'previsao_conclusao', type: 'date', nullable: true })
  previsaoConclusao?: Date;

  @Column({ name: 'inicio_faturamento', type: 'date', nullable: true })
  inicioFaturamento?: Date;

  @Column({ name: 'vencimento', type: 'varchar', length: 50, nullable: true })
  vencimento?: string;

  @Column({ name: 'data_faturamento', type: 'date', nullable: true })
  dataFaturamento?: Date;

  @Column({ name: 'data_vencimento', type: 'date', nullable: true })
  dataVencimento?: Date;

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

  // Campos de status (datas)
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

  // Campos de motivo
  @Column({ name: 'motivo_cancelamento', type: 'text', nullable: true })
  motivoCancelamento?: string;

  @Column({ name: 'motivo_declinio', type: 'text', nullable: true })
  motivoDeclinio?: string;

  // Campos de validade
  @Column({ name: 'data_validade', type: 'date', nullable: true })
  dataValidade?: Date;

  @Column({ name: 'data_limite_aceite', type: 'date', nullable: true })
  dataLimiteAceite?: Date;

  // Campos específicos para tipos de serviço
  @Column({ name: 'data_inicio_analise', type: 'date', nullable: true })
  dataInicioAnalise?: Date;

  @Column({ name: 'data_programada_homologacao', type: 'date', nullable: true })
  dataProgramadaHomologacao?: Date;

  @Column({ name: 'data_programada_producao', type: 'date', nullable: true })
  dataProgramadaProducao?: Date;

  @Column({ name: 'tipo_produto_assinado', type: 'varchar', length: 100, nullable: true })
  tipoProdutoAssinado?: string;

  @Column({ name: 'quantidade_usuarios', type: 'integer', nullable: true })
  quantidadeUsuarios?: number;

  @Column({ name: 'valor_unitario_usuario', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorUnitarioUsuario?: number;

  @Column({ name: 'data_inicio_assinatura', type: 'date', nullable: true })
  dataInicioAssinatura?: Date;

  @Column({ name: 'vencimento_assinatura', type: 'date', nullable: true })
  vencimentoAssinatura?: Date;

  @Column({ name: 'descricao_manutencao', type: 'text', nullable: true })
  descricaoManutencao?: string;

  @Column({ name: 'valor_mensal_manutencao', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorMensalManutencao?: number;

  @Column({ name: 'data_inicio_manutencao', type: 'date', nullable: true })
  dataInicioManutencao?: Date;

  @Column({ name: 'vencimento_manutencao', type: 'date', nullable: true })
  vencimentoManutencao?: Date;

  @Column({ name: 'valor_mensal_fixo', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorMensalFixo?: number;

  @Column({ name: 'data_fim_contrato', type: 'date', nullable: true })
  dataFimContrato?: Date;

  @Column({ name: 'tem_manutencao_vinculada', default: false, nullable: true })
  temManutencaoVinculada?: boolean;

  @Column({ name: 'proposta_manutencao_id', nullable: true })
  propostaManutencaoId?: string;

  // Parcelas (armazenado como JSON string)
  @Column({ name: 'parcelas', type: 'text', nullable: true })
  parcelas?: string;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

