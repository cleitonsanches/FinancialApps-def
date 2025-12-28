import { DataSource } from 'typeorm';

export async function ensureProposalMotivoFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se as colunas existem
    const table = await queryRunner.getTable('proposals');
    const hasMotivoCancelamento = table?.columns.find(col => col.name === 'motivo_cancelamento');
    const hasMotivoDeclinio = table?.columns.find(col => col.name === 'motivo_declinio');
    
    if (!hasMotivoCancelamento) {
      console.log('Adicionando coluna motivo_cancelamento à tabela proposals...');
      await queryRunner.query(`ALTER TABLE proposals ADD COLUMN motivo_cancelamento TEXT`);
      console.log('Coluna motivo_cancelamento adicionada com sucesso!');
    } else {
      console.log('Coluna motivo_cancelamento já existe na tabela proposals');
    }
    
    if (!hasMotivoDeclinio) {
      console.log('Adicionando coluna motivo_declinio à tabela proposals...');
      await queryRunner.query(`ALTER TABLE proposals ADD COLUMN motivo_declinio TEXT`);
      console.log('Coluna motivo_declinio adicionada com sucesso!');
    } else {
      console.log('Coluna motivo_declinio já existe na tabela proposals');
    }
  } catch (error) {
    console.error('Erro ao verificar/adicionar colunas na tabela proposals:', error);
    // Não lançar erro para não impedir o servidor de iniciar
  } finally {
    await queryRunner.release();
  }
}


