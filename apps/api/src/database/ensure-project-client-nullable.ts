import { DataSource } from 'typeorm';

/**
 * Garante que a coluna client_id na tabela projects seja nullable
 * Isso permite criar projetos sem vincular a um cliente
 * 
 * SQLite não suporta ALTER COLUMN diretamente, então recriamos a tabela
 */
export async function ensureProjectClientNullable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('projects');
    if (!table) {
      console.log('⚠️  Tabela projects não encontrada - será criada pelo TypeORM');
      return;
    }

    const clientIdColumn = table.findColumnByName('client_id');
    
    if (!clientIdColumn) {
      console.log('⚠️  Coluna client_id não encontrada na tabela projects');
      return;
    }

    if (clientIdColumn.isNullable) {
      console.log('✅ Coluna client_id já é nullable na tabela projects');
      return;
    }

    console.log('🔧 Tornando coluna client_id nullable na tabela projects...');
    
    // SQLite não suporta ALTER COLUMN, então precisamos recriar a tabela
    await queryRunner.query('PRAGMA foreign_keys=off;');
    await queryRunner.query('BEGIN TRANSACTION;');
    
    // Criar tabela temporária com client_id nullable
    await queryRunner.query(`
      CREATE TABLE projects_temp (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        client_id TEXT,
        proposal_id TEXT,
        template_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        service_type TEXT,
        data_inicio TEXT,
        data_fim TEXT,
        status TEXT NOT NULL DEFAULT 'PENDENTE',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Copiar dados
    await queryRunner.query(`
      INSERT INTO projects_temp 
      SELECT 
        id, company_id, client_id, proposal_id, template_id,
        name, description, service_type, data_inicio, data_fim,
        status, created_at, updated_at
      FROM projects;
    `);
    
    // Dropar tabela antiga
    await queryRunner.query('DROP TABLE projects;');
    
    // Renomear tabela temporária
    await queryRunner.query('ALTER TABLE projects_temp RENAME TO projects;');
    
    // Recriar índices
    await queryRunner.query('CREATE INDEX IF NOT EXISTS IX_projects_company_id ON projects(company_id);');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS IX_projects_proposal_id ON projects(proposal_id);');
    
    await queryRunner.query('COMMIT;');
    await queryRunner.query('PRAGMA foreign_keys=on;');
    
    console.log('✅ Coluna client_id agora é nullable na tabela projects');
  } catch (error: any) {
    console.error('❌ Erro ao tornar client_id nullable:', error.message);
    try {
      await queryRunner.query('ROLLBACK;');
      await queryRunner.query('PRAGMA foreign_keys=on;');
    } catch (rollbackError) {
      // Ignorar erro de rollback
    }
    // Não lançar erro para não impedir o startup da aplicação
  } finally {
    await queryRunner.release();
  }
}

