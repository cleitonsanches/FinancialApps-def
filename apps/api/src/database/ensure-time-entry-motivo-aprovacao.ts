import { DataSource } from 'typeorm';

export async function ensureTimeEntryMotivoAprovacao(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a coluna existe
    const table = await queryRunner.getTable('time_entries');
    const hasMotivoAprovacao = table?.columns.find(col => col.name === 'motivo_aprovacao');
    
    if (!hasMotivoAprovacao) {
      console.log('Adicionando coluna motivo_aprovacao à tabela time_entries...');
      await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN motivo_aprovacao TEXT`);
      console.log('Coluna motivo_aprovacao adicionada com sucesso!');
    } else {
      console.log('Coluna motivo_aprovacao já existe na tabela time_entries');
    }
  } catch (error) {
    console.error('Erro ao verificar/adicionar coluna motivo_aprovacao na tabela time_entries:', error);
    // Não lançar erro para não impedir o servidor de iniciar
  } finally {
    await queryRunner.release();
  }
}

