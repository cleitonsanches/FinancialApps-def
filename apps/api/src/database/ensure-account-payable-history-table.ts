import { DataSource } from 'typeorm';

export async function ensureAccountPayableHistoryTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('account_payable_history');
    
    if (!table) {
      console.log('Criando tabela account_payable_history...');
      
      await queryRunner.query(`
        CREATE TABLE account_payable_history (
          id VARCHAR(36) PRIMARY KEY,
          account_payable_id VARCHAR(36) NOT NULL,
          action VARCHAR(50) NOT NULL,
          field_name VARCHAR(100),
          old_value TEXT,
          new_value TEXT,
          description TEXT,
          changed_by VARCHAR(36),
          changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX IX_account_payable_history_account_payable_id (account_payable_id),
          FOREIGN KEY (account_payable_id) REFERENCES accounts_payable(id) ON DELETE CASCADE,
          FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      
      console.log('✅ Tabela account_payable_history criada com sucesso.');
    } else {
      console.log('ℹ️ Tabela account_payable_history já existe.');
    }
  } catch (error: any) {
    console.error('Erro ao garantir tabela account_payable_history:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

