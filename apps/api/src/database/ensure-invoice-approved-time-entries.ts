import { DataSource } from 'typeorm';

export async function ensureInvoiceApprovedTimeEntries(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe primeiro
    const table = await queryRunner.getTable('invoices');
    if (!table) {
      console.log('⚠️ Tabela invoices não encontrada. Pulando verificação de coluna approved_time_entries.');
      await queryRunner.release();
      return;
    }
    
    // Verificar se a coluna já existe
    const columnExists = table.findColumnByName('approved_time_entries');
    
    if (!columnExists) {
      console.log('Adicionando coluna approved_time_entries na tabela invoices...');
      await queryRunner.query(`
        ALTER TABLE invoices 
        ADD COLUMN approved_time_entries TEXT
      `);
      console.log('✅ Coluna approved_time_entries adicionada com sucesso!');
    } else {
      console.log('✅ Coluna approved_time_entries já existe na tabela invoices');
    }
  } catch (error) {
    console.error('Erro ao adicionar coluna approved_time_entries:', error);
    // Não lançar erro para não impedir o servidor de iniciar
  } finally {
    await queryRunner.release();
  }
}


