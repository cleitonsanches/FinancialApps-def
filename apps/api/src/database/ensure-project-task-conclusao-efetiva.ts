import { DataSource } from 'typeorm';

export async function ensureProjectTaskConclusaoEfetiva(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe primeiro
    const table = await queryRunner.getTable('project_tasks');
    if (!table) {
      console.log('⚠️ Tabela project_tasks não encontrada. Pulando verificação de colunas.');
      await queryRunner.release();
      return;
    }
    
    const existingColumns = table.columns.map(col => col.name);
    
    // Verificar e adicionar coluna conclusao_efetiva
    if (!existingColumns.includes('conclusao_efetiva')) {
      try {
        await queryRunner.query(`
          ALTER TABLE project_tasks ADD conclusao_efetiva DATE NULL
        `);
        console.log('✓ Coluna conclusao_efetiva adicionada à tabela project_tasks');
      } catch (error: any) {
        if (!error.message.includes('duplicate column') && !error.message.includes('already exists') && !error.message.includes('duplicate column name')) {
          console.error('Erro ao adicionar coluna conclusao_efetiva:', error.message);
        }
      }
    } else {
      console.log('✅ Coluna conclusao_efetiva já existe');
    }
  } catch (error) {
    console.error('Erro ao garantir coluna conclusao_efetiva em project_tasks:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

