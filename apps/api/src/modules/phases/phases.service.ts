import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Phase } from '../../database/entities/phase.entity';
import { Project } from '../../database/entities/project.entity';

/**
 * Service para gerenciar Fases de Projetos
 * 
 * Permite criar, atualizar, listar e deletar fases dentro de um projeto.
 * As fases organizam as atividades do projeto em etapas lógicas de produção.
 */
@Injectable()
export class PhasesService {
  constructor(
    @InjectRepository(Phase)
    private phaseRepository: Repository<Phase>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  /**
   * Busca todas as fases de um projeto
   */
  async findAll(projectId: string): Promise<Phase[]> {
    return this.phaseRepository.find({
      where: { projectId },
      relations: ['project', 'tasks'],
      order: { ordem: 'ASC' },
    });
  }

  /**
   * Busca uma fase específica por ID
   */
  async findOne(id: string): Promise<Phase> {
    return this.phaseRepository.findOne({
      where: { id },
      relations: ['project', 'tasks'],
    });
  }

  /**
   * Cria uma nova fase para um projeto
   */
  async create(projectId: string, phaseData: Partial<Phase>): Promise<Phase> {
    // Verificar se o projeto existe
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new Error('Projeto não encontrado');
    }

    // Se não foi informada a ordem, buscar a última ordem e incrementar
    if (phaseData.ordem === undefined || phaseData.ordem === null) {
      const lastPhase = await this.phaseRepository.findOne({
        where: { projectId },
        order: { ordem: 'DESC' },
      });
      phaseData.ordem = lastPhase ? lastPhase.ordem + 1 : 0;
    }

    const phase = this.phaseRepository.create({
      ...phaseData,
      projectId,
      status: phaseData.status || 'PENDENTE',
    });

    return this.phaseRepository.save(phase);
  }

  /**
   * Atualiza uma fase existente
   */
  async update(id: string, phaseData: Partial<Phase>): Promise<Phase> {
    await this.phaseRepository.update(id, phaseData);
    return this.findOne(id);
  }

  /**
   * Deleta uma fase
   * Nota: As tarefas vinculadas à fase terão phase_id definido como NULL (onDelete: 'SET NULL')
   */
  async delete(id: string): Promise<void> {
    await this.phaseRepository.delete(id);
  }

  /**
   * Reordena as fases de um projeto
   * Útil para quando o usuário arrasta e solta fases no Kanban
   */
  async reorder(projectId: string, phaseOrders: { id: string; ordem: number }[]): Promise<void> {
    for (const { id, ordem } of phaseOrders) {
      await this.phaseRepository.update(id, { ordem });
    }
  }
}

