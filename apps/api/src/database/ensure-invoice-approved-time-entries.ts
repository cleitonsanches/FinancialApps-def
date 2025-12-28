import { DataSource } from 'typeorm';

export async function ensureInvoiceApprovedTimeEntries(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a coluna já existe
    const table = await queryRunner.getTable('invoices');
    const columnExists = table?.findColumnByName('approved_time_entries');
    
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
    throw error;
  } finally {
    await queryRunner.release();
  }
}


