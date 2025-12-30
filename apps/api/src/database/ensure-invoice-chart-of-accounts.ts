import { DataSource } from 'typeorm';

export async function ensureInvoiceChartOfAccounts(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    // Verificar se a tabela existe primeiro
    const table = await queryRunner.getTable('invoices');
    if (!table) {
      console.log('⚠️ Tabela invoices não encontrada. Pulando verificação de coluna chart_of_accounts_id.');
      await queryRunner.release();
      return;
    }
    
    // Verificar se a coluna já existe
    const hasColumn = table.columns.find(col => col.name === 'chart_of_accounts_id');
    
    if (!hasColumn) {
      console.log('Adicionando coluna chart_of_accounts_id na tabela invoices...');
      await queryRunner.query(`
        ALTER TABLE invoices ADD COLUMN chart_of_accounts_id VARCHAR(36)
      `);
      
      // Criar índice
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS IX_invoices_chart_of_accounts_id ON invoices(chart_of_accounts_id)
      `);
      
      console.log('✅ Coluna chart_of_accounts_id adicionada com sucesso!');
    } else {
      console.log('✅ Coluna chart_of_accounts_id já existe na tabela invoices');
    }
  } catch (error: any) {
    if (!error.message.includes('duplicate column')) {
      console.error('Erro ao adicionar coluna chart_of_accounts_id:', error.message);
    }
  } finally {
    await queryRunner.release();
  }
}



