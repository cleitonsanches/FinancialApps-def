import { DataSource } from 'typeorm';

export async function ensureReimbursementsTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('reimbursements');
    
    if (!table) {
      console.log('Criando tabela reimbursements...');
      
      await queryRunner.query(`
        CREATE TABLE "reimbursements" (
          "id" varchar PRIMARY KEY NOT NULL,
          "company_id" varchar NOT NULL,
          "user_id" varchar,
          "description" text NOT NULL,
          "chart_of_accounts_id" varchar,
          "expense_date" date NOT NULL,
          "amount" decimal(15,2) NOT NULL,
          "status" varchar(50) NOT NULL DEFAULT 'SOLICITADO',
          "account_payable_id" varchar(36),
          "invoice_id" varchar(36),
          "created_at" datetime NOT NULL DEFAULT (datetime('now')),
          "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
        )
      `);
      
      // Criar índices
      await queryRunner.query(`CREATE INDEX "IX_reimbursements_company_id" ON "reimbursements" ("company_id")`);
      await queryRunner.query(`CREATE INDEX "IX_reimbursements_user_id" ON "reimbursements" ("user_id")`);
      await queryRunner.query(`CREATE INDEX "IX_reimbursements_account_payable_id" ON "reimbursements" ("account_payable_id")`);
      await queryRunner.query(`CREATE INDEX "IX_reimbursements_invoice_id" ON "reimbursements" ("invoice_id")`);
      await queryRunner.query(`CREATE INDEX "IX_reimbursements_status" ON "reimbursements" ("status")`);
      
      console.log('✅ Tabela reimbursements criada com sucesso');
    } else {
      console.log('Tabela reimbursements já existe');
    }
  } catch (error: any) {
    console.error('Erro ao criar/verificar tabela reimbursements:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

