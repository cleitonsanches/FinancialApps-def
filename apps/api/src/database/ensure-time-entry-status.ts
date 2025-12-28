import { DataSource } from 'typeorm';

export async function ensureTimeEntryStatus(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('time_entries');
    if (!table) {
      console.log('⚠️ Tabela time_entries não encontrada');
      return;
    }

    // Verificar se a coluna status já existe
    const hasStatus = table.findColumnByName('status');

    if (!hasStatus) {
      console.log('📝 Adicionando coluna status à tabela time_entries...');
      try {
        await queryRunner.query(`
          ALTER TABLE time_entries 
          ADD COLUMN status TEXT DEFAULT 'PENDENTE'
        `);
        console.log('✅ Coluna status adicionada com sucesso!');
        
        // Atualizar registros existentes para PENDENTE
        await queryRunner.query(`
          UPDATE time_entries 
          SET status = 'PENDENTE' 
          WHERE status IS NULL
        `);
        console.log('✅ Registros existentes atualizados para PENDENTE');
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate column')) {
          console.log('ℹ️ Coluna status já existe');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Coluna status já existe na tabela time_entries');
    }

  } catch (error: any) {
    console.error('❌ Erro ao garantir coluna status:', error.message);
  } finally {
    await queryRunner.release();
  }
}

