import { DataSource } from 'typeorm';

/**
 * Script de migração para criar a tabela phases e adicionar a coluna phase_id em project_tasks
 * 
 * Este script garante que:
 * 1. A tabela phases existe com todas as colunas necessárias
 * 2. A coluna phase_id existe na tabela project_tasks
 * 3. Os índices necessários são criados
 * 
 * Executado automaticamente no onModuleInit do AppModule
 */
export async function ensurePhasesTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // ============================================
    // 1. CRIAR TABELA PHASES
    // ============================================
    const phasesTable = await queryRunner.getTable('phases');
    
    if (!phasesTable) {
      console.log('📝 Criando tabela phases...');
      
      await queryRunner.query(`
        CREATE TABLE "phases" (
          "id" varchar PRIMARY KEY NOT NULL,
          "project_id" varchar NOT NULL,
          "name" varchar(255) NOT NULL,
          "description" text,
          "ordem" integer NOT NULL DEFAULT 0,
          "data_inicio" date,
          "data_fim" date,
          "status" varchar(50) NOT NULL DEFAULT 'PENDENTE',
          "created_at" datetime NOT NULL DEFAULT (datetime('now')),
          "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
        )
      `);
      
      // Criar índices
      await queryRunner.query(`CREATE INDEX "IX_phases_project_id" ON "phases" ("project_id")`);
      
      console.log('✅ Tabela phases criada com sucesso!');
    } else {
      console.log('✅ Tabela phases já existe');
      
      // Verificar e adicionar colunas que possam estar faltando
      const columns = phasesTable.columns.map(col => col.name);
      
      const requiredColumns = [
        { name: 'description', sql: 'text' },
        { name: 'ordem', sql: 'integer NOT NULL DEFAULT 0' },
        { name: 'data_inicio', sql: 'date' },
        { name: 'data_fim', sql: 'date' },
        { name: 'status', sql: "varchar(50) NOT NULL DEFAULT 'PENDENTE'" },
      ];
      
      for (const col of requiredColumns) {
        if (!columns.includes(col.name)) {
          console.log(`📝 Adicionando coluna ${col.name} à tabela phases...`);
          await queryRunner.query(`ALTER TABLE "phases" ADD COLUMN "${col.name}" ${col.sql}`);
          console.log(`✅ Coluna ${col.name} adicionada com sucesso!`);
        }
      }
    }

    // ============================================
    // 2. ADICIONAR COLUNA PHASE_ID EM PROJECT_TASKS
    // ============================================
    const projectTasksTable = await queryRunner.getTable('project_tasks');
    
    if (projectTasksTable) {
      const hasPhaseId = projectTasksTable.findColumnByName('phase_id');
      
      if (!hasPhaseId) {
        console.log('📝 Adicionando coluna phase_id à tabela project_tasks...');
        
        await queryRunner.query(`
          ALTER TABLE "project_tasks" 
          ADD COLUMN "phase_id" varchar
        `);
        
        // Criar índice
        await queryRunner.query(`CREATE INDEX "IX_project_tasks_phase_id" ON "project_tasks" ("phase_id")`);
        
        console.log('✅ Coluna phase_id adicionada com sucesso!');
      } else {
        console.log('✅ Coluna phase_id já existe na tabela project_tasks');
      }
    } else {
      console.log('⚠️ Tabela project_tasks não encontrada');
    }

  } catch (error: any) {
    console.error('❌ Erro ao garantir tabela phases e coluna phase_id:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

