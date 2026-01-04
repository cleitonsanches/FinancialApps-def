import { DataSource } from 'typeorm';

export async function ensureAccountPayableHistoryTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('account_payable_history');
    
    if (!table) {
      console.log('Criando tabela account_payable_history...');
      
      await queryRunner.query(`
        CREATE TABLE "account_payable_history" (
          "id" varchar PRIMARY KEY NOT NULL,
          "account_payable_id" varchar NOT NULL,
          "action" varchar(50) NOT NULL,
          "field_name" varchar(100),
          "old_value" text,
          "new_value" text,
          "description" text,
          "changed_by" varchar,
          "changed_at" datetime NOT NULL DEFAULT (datetime('now'))
        )
      `);
      
      // Criar índices
      await queryRunner.query(`CREATE INDEX "IX_account_payable_history_account_payable_id" ON "account_payable_history" ("account_payable_id")`);
      
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

