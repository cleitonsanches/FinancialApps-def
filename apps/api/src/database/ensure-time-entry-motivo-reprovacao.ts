import { DataSource } from 'typeorm';

export async function ensureTimeEntryMotivoReprovacao(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a coluna existe
    const table = await queryRunner.getTable('time_entries');
    const hasMotivoReprovacao = table?.columns.find(col => col.name === 'motivo_reprovacao');
    
    if (!hasMotivoReprovacao) {
      console.log('Adicionando coluna motivo_reprovacao à tabela time_entries...');
      await queryRunner.query(`ALTER TABLE time_entries ADD COLUMN motivo_reprovacao TEXT`);
      console.log('Coluna motivo_reprovacao adicionada com sucesso!');
    } else {
      console.log('Coluna motivo_reprovacao já existe na tabela time_entries');
    }
  } catch (error) {
    console.error('Erro ao verificar/adicionar coluna motivo_reprovacao na tabela time_entries:', error);
    // Não lançar erro para não impedir o servidor de iniciar
  } finally {
    await queryRunner.release();
  }
}




