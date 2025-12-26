import { DataSource } from 'typeorm';

export async function ensureProjectTaskVinculos(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se as colunas já existem
    const table = await queryRunner.getTable('project_tasks');
    if (!table) {
      console.log('⚠️ Tabela project_tasks não encontrada');
      return;
    }

    const hasProposalId = table.findColumnByName('proposal_id');
    const hasClientId = table.findColumnByName('client_id');

    // Adicionar proposal_id se não existir
    if (!hasProposalId) {
      console.log('📝 Adicionando coluna proposal_id...');
      try {
        await queryRunner.query(`
          ALTER TABLE project_tasks ADD COLUMN proposal_id TEXT
        `);
        console.log('✅ Coluna proposal_id adicionada');
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate column')) {
          console.log('ℹ️ Coluna proposal_id já existe');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Coluna proposal_id já existe');
    }

    // Adicionar client_id se não existir
    if (!hasClientId) {
      console.log('📝 Adicionando coluna client_id...');
      try {
        await queryRunner.query(`
          ALTER TABLE project_tasks ADD COLUMN client_id TEXT
        `);
        console.log('✅ Coluna client_id adicionada');
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate column')) {
          console.log('ℹ️ Coluna client_id já existe');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Coluna client_id já existe');
    }

  } catch (error: any) {
    console.error('❌ Erro ao garantir colunas de vínculos:', error.message);
  } finally {
    await queryRunner.release();
  }
}

