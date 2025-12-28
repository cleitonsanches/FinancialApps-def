import { DataSource } from 'typeorm';

export async function ensureTimeEntriesVinculos(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('time_entries');
    if (!table) {
      console.log('⚠️ Tabela time_entries não encontrada');
      return;
    }

    const hasProposalId = table.findColumnByName('proposal_id');
    const hasClientId = table.findColumnByName('client_id');
    const projectIdColumn = table.findColumnByName('project_id');
    const isProjectIdNullable = projectIdColumn?.isNullable;

    // Tornar project_id nullable se necessário (SQLite não suporta ALTER COLUMN diretamente)
    // Por enquanto, apenas logamos - a migração manual pode ser necessária
    if (projectIdColumn && !isProjectIdNullable) {
      console.log('ℹ️ project_id não é nullable. Para tornar nullable, execute migração manual se necessário.');
    }

    // Adicionar proposal_id se não existir
    if (!hasProposalId) {
      console.log('📝 Adicionando coluna proposal_id na tabela time_entries...');
      try {
        await queryRunner.query(`
          ALTER TABLE time_entries ADD COLUMN proposal_id TEXT
        `);
        console.log('✅ Coluna proposal_id adicionada na tabela time_entries');
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate column')) {
          console.log('ℹ️ Coluna proposal_id já existe na tabela time_entries');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Coluna proposal_id já existe na tabela time_entries');
    }

    // Adicionar client_id se não existir
    if (!hasClientId) {
      console.log('📝 Adicionando coluna client_id na tabela time_entries...');
      try {
        await queryRunner.query(`
          ALTER TABLE time_entries ADD COLUMN client_id TEXT
        `);
        console.log('✅ Coluna client_id adicionada na tabela time_entries');
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate column')) {
          console.log('ℹ️ Coluna client_id já existe na tabela time_entries');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Coluna client_id já existe na tabela time_entries');
    }

  } catch (error: any) {
    console.error('❌ Erro ao garantir colunas de vínculos em time_entries:', error.message);
  } finally {
    await queryRunner.release();
  }
}


