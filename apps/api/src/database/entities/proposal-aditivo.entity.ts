import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Proposal } from './proposal.entity';

@Entity('proposal_aditivos')
@Index('IX_proposal_aditivos_proposal_id', ['proposalId'])
export class ProposalAditivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'proposal_id' })
  proposalId: string;

  @ManyToOne(() => Proposal, proposal => proposal.aditivos)
  @JoinColumn({ name: 'proposal_id' })
  proposal: Proposal;

  @Column({ name: 'data_aditivo', type: 'date' })
  dataAditivo: Date;

  @Column({ name: 'percentual_reajuste', type: 'decimal', precision: 5, scale: 2 })
  percentualReajuste: number;

  @Column({ name: 'valor_anterior', type: 'decimal', precision: 15, scale: 2 })
  valorAnterior: number;

  @Column({ name: 'valor_novo', type: 'decimal', precision: 15, scale: 2 })
  valorNovo: number;

  @Column({ name: 'ano_referencia', type: 'integer' })
  anoReferencia: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

