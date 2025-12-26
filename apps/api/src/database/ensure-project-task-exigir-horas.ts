import { DataSource } from 'typeorm';

export async function ensureProjectTaskExigirHoras(dataSource: DataSource) {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a coluna já existe
    const table = await queryRunner.getTable('project_tasks');
    if (!table) {
      console.log('⚠️ Tabela project_tasks não encontrada');
      return;
    }

    const hasExigirLancamentoHoras = table.findColumnByName('exigir_lancamento_horas');

    // Adicionar exigir_lancamento_horas se não existir
    if (!hasExigirLancamentoHoras) {
      console.log('📝 Adicionando coluna exigir_lancamento_horas...');
      try {
        await queryRunner.query(`
          ALTER TABLE project_tasks ADD COLUMN exigir_lancamento_horas INTEGER DEFAULT 0
        `);
        console.log('✅ Coluna exigir_lancamento_horas adicionada');
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate column')) {
          console.log('ℹ️ Coluna exigir_lancamento_horas já existe');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Coluna exigir_lancamento_horas já existe');
    }

  } catch (error: any) {
    console.error('❌ Erro ao garantir coluna exigir_lancamento_horas:', error.message);
  } finally {
    await queryRunner.release();
  }
}

