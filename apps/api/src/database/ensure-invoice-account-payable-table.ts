import { DataSource } from 'typeorm';

export async function ensureInvoiceAccountPayableTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    const table = await queryRunner.getTable('invoice_account_payable');
    
    if (!table) {
      console.log('Criando tabela invoice_account_payable...');
      
      await queryRunner.query(`
        CREATE TABLE "invoice_account_payable" (
          "id" varchar PRIMARY KEY NOT NULL,
          "invoice_id" varchar NOT NULL,
          "account_payable_id" varchar NOT NULL,
          "valor_contribuido" decimal(15,2) NOT NULL,
          "created_at" datetime NOT NULL DEFAULT (datetime('now'))
        )
      `);
      
      await queryRunner.query(`CREATE INDEX "IX_invoice_account_payable_invoice_id" ON "invoice_account_payable" ("invoice_id")`);
      await queryRunner.query(`CREATE INDEX "IX_invoice_account_payable_account_payable_id" ON "invoice_account_payable" ("account_payable_id")`);
      
      console.log('✅ Tabela invoice_account_payable criada com sucesso');
    } else {
      console.log('Tabela invoice_account_payable já existe');
    }
  } catch (error: any) {
    console.error('Erro ao criar/verificar tabela invoice_account_payable:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
  }
}





