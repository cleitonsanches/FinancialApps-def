import { DataSource } from 'typeorm';

export async function ensureInvoiceHistoryTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('invoice_history');
    
    if (!table) {
      console.log('Criando tabela invoice_history...');
      
      await queryRunner.query(`
        CREATE TABLE "invoice_history" (
          "id" varchar PRIMARY KEY NOT NULL,
          "invoice_id" varchar NOT NULL,
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
      await queryRunner.query(`CREATE INDEX "IX_invoice_history_invoice_id" ON "invoice_history" ("invoice_id")`);
      
      console.log('✅ Tabela invoice_history criada com sucesso');
    } else {
      console.log('Tabela invoice_history já existe');
    }
  } catch (error: any) {
    console.error('Erro ao criar/verificar tabela invoice_history:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

