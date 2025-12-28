import { DataSource } from 'typeorm';

export async function ensureTimeEntriesTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('time_entries');
    
    if (!table) {
      console.log('Criando tabela time_entries...');
      
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS time_entries (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL,
          task_id TEXT,
          user_id TEXT,
          data TEXT NOT NULL,
          horas REAL NOT NULL,
          descricao TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      
      await queryRunner.query('CREATE INDEX IF NOT EXISTS IX_time_entries_project_id ON time_entries(project_id)');
      await queryRunner.query('CREATE INDEX IF NOT EXISTS IX_time_entries_task_id ON time_entries(task_id)');
      
      console.log('Tabela time_entries criada com sucesso!');
    } else {
      console.log('Tabela time_entries já existe');
    }
  } catch (error) {
    console.error('Erro ao verificar/criar tabela time_entries:', error);
  } finally {
    await queryRunner.release();
  }
}


