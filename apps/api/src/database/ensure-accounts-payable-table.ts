import { DataSource } from 'typeorm';

export async function ensureAccountsPayableTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('accounts_payable');
    
    if (!table) {
      console.log('Criando tabela accounts_payable...');
      
      await queryRunner.query(`
        CREATE TABLE "accounts_payable" (
          "id" varchar PRIMARY KEY NOT NULL,
          "company_id" varchar NOT NULL,
          "codigo" varchar(50),
          "supplier_id" varchar NOT NULL,
          "description" text NOT NULL,
          "chart_of_accounts_id" varchar,
          "emission_date" date NOT NULL,
          "due_date" date NOT NULL,
          "total_value" decimal(15,2) NOT NULL,
          "status" varchar(50) NOT NULL DEFAULT 'PROVISIONADA',
          "payment_date" date,
          "bank_account_id" varchar(36),
          "is_reembolsavel" boolean NOT NULL DEFAULT 0,
          "valor_reembolsar" decimal(15,2),
          "status_reembolso" varchar(50),
          "data_status_reembolso" date,
          "destinatario_fatura_reembolso_id" varchar(36),
          "created_at" datetime NOT NULL DEFAULT (datetime('now')),
          "updated_at" datetime NOT NULL DEFAULT (datetime('now'))
        )
      `);
      
      // Criar índices
      await queryRunner.query(`CREATE INDEX "IX_accounts_payable_company_id" ON "accounts_payable" ("company_id")`);
      await queryRunner.query(`CREATE INDEX "IX_accounts_payable_supplier_id" ON "accounts_payable" ("supplier_id")`);
      await queryRunner.query(`CREATE INDEX "IX_accounts_payable_status" ON "accounts_payable" ("status")`);
      await queryRunner.query(`CREATE INDEX "IX_accounts_payable_due_date" ON "accounts_payable" ("due_date")`);
      
      console.log('✅ Tabela accounts_payable criada com sucesso');
    } else {
      console.log('Tabela accounts_payable já existe');
      
      // Verificar e adicionar colunas que possam estar faltando
      const columns = table.columns.map(col => col.name);
      
      const requiredColumns = [
        'codigo',
        'is_reembolsavel',
        'valor_reembolsar',
        'status_reembolso',
        'data_status_reembolso',
        'destinatario_fatura_reembolso_id',
      ];
      
      for (const colName of requiredColumns) {
        if (!columns.includes(colName)) {
          console.log(`Adicionando coluna ${colName}...`);
          
          if (colName === 'codigo') {
            await queryRunner.query(`ALTER TABLE "accounts_payable" ADD COLUMN "codigo" varchar(50)`);
          } else if (colName === 'is_reembolsavel') {
            await queryRunner.query(`ALTER TABLE "accounts_payable" ADD COLUMN "is_reembolsavel" boolean NOT NULL DEFAULT 0`);
          } else if (colName === 'valor_reembolsar') {
            await queryRunner.query(`ALTER TABLE "accounts_payable" ADD COLUMN "valor_reembolsar" decimal(15,2)`);
          } else if (colName === 'status_reembolso') {
            await queryRunner.query(`ALTER TABLE "accounts_payable" ADD COLUMN "status_reembolso" varchar(50)`);
          } else if (colName === 'data_status_reembolso') {
            await queryRunner.query(`ALTER TABLE "accounts_payable" ADD COLUMN "data_status_reembolso" date`);
          } else if (colName === 'destinatario_fatura_reembolso_id') {
            await queryRunner.query(`ALTER TABLE "accounts_payable" ADD COLUMN "destinatario_fatura_reembolso_id" varchar(36)`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Erro ao criar/verificar tabela accounts_payable:', error.message);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

