import { DataSource } from 'typeorm';

export async function ensureProposalAditivosTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('proposal_aditivos');
    
    if (!table) {
      console.log('Criando tabela proposal_aditivos...');
      await queryRunner.query(`
        CREATE TABLE proposal_aditivos (
          id VARCHAR(36) PRIMARY KEY,
          proposal_id VARCHAR(36) NOT NULL,
          data_aditivo DATE NOT NULL,
          percentual_reajuste DECIMAL(5,2) NOT NULL,
          valor_anterior DECIMAL(15,2) NOT NULL,
          valor_novo DECIMAL(15,2) NOT NULL,
          ano_referencia INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Criar índice
      await queryRunner.query(`
        CREATE INDEX IX_proposal_aditivos_proposal_id ON proposal_aditivos(proposal_id)
      `);
      
      console.log('✅ Tabela proposal_aditivos criada com sucesso!');
    } else {
      console.log('✅ Tabela proposal_aditivos já existe');
    }
  } catch (error: any) {
    console.error('Erro ao criar tabela proposal_aditivos:', error.message);
  } finally {
    await queryRunner.release();
  }
}






