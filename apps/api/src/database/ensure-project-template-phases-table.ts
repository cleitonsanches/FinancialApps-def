import { DataSource } from 'typeorm';

export async function ensureProjectTemplatePhasesTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('project_template_phases');
    
    if (!table) {
      console.log('Criando tabela project_template_phases...');
      
      await queryRunner.query(`
        CREATE TABLE "project_template_phases" (
          "id" varchar PRIMARY KEY NOT NULL,
          "template_id" varchar NOT NULL,
          "name" varchar(255) NOT NULL,
          "description" text,
          "ordem" integer NOT NULL DEFAULT 0,
          "created_at" datetime NOT NULL DEFAULT (datetime('now')),
          "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
        )
      `);
      
      // Criar índices
      await queryRunner.query(`CREATE INDEX "IX_project_template_phases_template_id" ON "project_template_phases" ("template_id")`);
      
      console.log('✅ Tabela project_template_phases criada com sucesso');
    } else {
      console.log('Tabela project_template_phases já existe');
    }

    // Adicionar coluna phase_id em project_template_tasks se não existir
    const tasksTable = await queryRunner.getTable('project_template_tasks');
    if (tasksTable) {
      const hasPhaseId = tasksTable.findColumnByName('phase_id');
      if (!hasPhaseId) {
        console.log('Adicionando coluna phase_id em project_template_tasks...');
        await queryRunner.query(`
          ALTER TABLE "project_template_tasks" 
          ADD COLUMN "phase_id" varchar
        `);
        await queryRunner.query(`CREATE INDEX "IX_project_template_tasks_phase_id" ON "project_template_tasks" ("phase_id")`);
        console.log('✅ Coluna phase_id adicionada com sucesso');
      }
    }
  } catch (error: any) {
    console.error('Erro ao criar/verificar tabela project_template_phases:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

