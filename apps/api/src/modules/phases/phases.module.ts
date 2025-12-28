import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhasesController } from './phases.controller';
import { PhasesService } from './phases.service';
import { Phase } from '../../database/entities/phase.entity';
import { Project } from '../../database/entities/project.entity';

/**
 * Módulo de Fases
 * 
 * Gerencia as fases de produção dentro dos projetos.
 * Hierarquia: Negociação > Projeto > Fase > Atividade
 */
@Module({
  imports: [TypeOrmModule.forFeature([Phase, Project])],
  controllers: [PhasesController],
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}

