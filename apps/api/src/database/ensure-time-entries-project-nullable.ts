import { DataSource } from 'typeorm';

export async function ensureTimeEntriesProjectNullable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('time_entries');
    if (!table) {
      console.log('Tabela time_entries não existe ainda');
      return;
    }
    
    // Verificar se project_id é NOT NULL
    const projectIdColumn = table.columns.find(col => col.name === 'project_id');
    if (!projectIdColumn) {
      console.log('Coluna project_id não encontrada na tabela time_entries');
      return;
    }
    
    // Se já é nullable, não precisa fazer nada
    if (projectIdColumn.isNullable) {
      console.log('Coluna project_id já é nullable na tabela time_entries');
      return;
    }
    
    // SQLite não suporta ALTER COLUMN diretamente, então precisamos recriar a tabela
    console.log('Tornando project_id nullable na tabela time_entries...');
    
    // Criar tabela temporária com a estrutura correta
    await queryRunner.query(`
      CREATE TABLE time_entries_new (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        task_id TEXT,
        user_id TEXT,
        proposal_id TEXT,
        client_id TEXT,
        data TEXT NOT NULL,
        horas REAL NOT NULL,
        descricao TEXT,
        status TEXT DEFAULT 'PENDENTE',
        motivo_reprovacao TEXT,
        motivo_aprovacao TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Copiar dados da tabela antiga para a nova
    await queryRunner.query(`
      INSERT INTO time_entries_new 
      (id, project_id, task_id, user_id, proposal_id, client_id, data, horas, descricao, status, motivo_reprovacao, motivo_aprovacao, created_at, updated_at)
      SELECT 
        id, project_id, task_id, user_id, proposal_id, client_id, data, horas, descricao, status, motivo_reprovacao, motivo_aprovacao, created_at, updated_at
      FROM time_entries
    `);
    
    // Dropar tabela antiga
    await queryRunner.query(`DROP TABLE time_entries`);
    
    // Renomear tabela nova
    await queryRunner.query(`ALTER TABLE time_entries_new RENAME TO time_entries`);
    
    // Recriar índices
    await queryRunner.query('CREATE INDEX IF NOT EXISTS IX_time_entries_project_id ON time_entries(project_id)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS IX_time_entries_task_id ON time_entries(task_id)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS IX_time_entries_proposal_id ON time_entries(proposal_id)');
    await queryRunner.query('CREATE INDEX IF NOT EXISTS IX_time_entries_client_id ON time_entries(client_id)');
    
    console.log('✅ project_id agora é nullable na tabela time_entries');
  } catch (error) {
    console.error('Erro ao tornar project_id nullable na tabela time_entries:', error);
    // Não lançar erro para não impedir o servidor de iniciar
  } finally {
    await queryRunner.release();
  }
}





