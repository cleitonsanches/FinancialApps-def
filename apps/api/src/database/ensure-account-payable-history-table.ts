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
          "id" varchar(36) PRIMARY KEY NOT NULL,
          "account_payable_id" varchar(36) NOT NULL,
          "action" varchar(50) NOT NULL,
          "field_name" varchar(100),
          "old_value" text,
          "new_value" text,
          "description" text,
          "changed_by" varchar(36),
          "changed_at" datetime NOT NULL DEFAULT GETDATE()
        )
      `);
      
      // Criar índices
      await queryRunner.query(`CREATE INDEX "IX_account_payable_history_account_payable_id" ON "account_payable_history" ("account_payable_id")`);
      
      console.log('✅ Tabela account_payable_history criada com sucesso.');
    } else {
      console.log('ℹ️ Tabela account_payable_history já existe.');
      
      // Verificar e corrigir tamanho das colunas UUID se necessário
      const columns = table.columns;
      
      // Verificar coluna id
      const idColumn = columns.find(col => col.name === 'id');
      if (idColumn && idColumn.type === 'varchar' && (!idColumn.length || idColumn.length < 36)) {
        console.log('Corrigindo tamanho da coluna id para varchar(36)...');
        await queryRunner.query(`ALTER TABLE "account_payable_history" ALTER COLUMN "id" varchar(36) NOT NULL`);
      }
      
      // Verificar coluna account_payable_id
      const accountPayableIdColumn = columns.find(col => col.name === 'account_payable_id');
      if (accountPayableIdColumn && accountPayableIdColumn.type === 'varchar' && (!accountPayableIdColumn.length || accountPayableIdColumn.length < 36)) {
        console.log('Corrigindo tamanho da coluna account_payable_id para varchar(36)...');
        await queryRunner.query(`ALTER TABLE "account_payable_history" ALTER COLUMN "account_payable_id" varchar(36) NOT NULL`);
      }
      
      // Verificar coluna changed_by
      const changedByColumn = columns.find(col => col.name === 'changed_by');
      if (changedByColumn && changedByColumn.type === 'varchar' && (!changedByColumn.length || changedByColumn.length < 36)) {
        console.log('Corrigindo tamanho da coluna changed_by para varchar(36)...');
        await queryRunner.query(`ALTER TABLE "account_payable_history" ALTER COLUMN "changed_by" varchar(36)`);
      }
    }
  } catch (error: any) {
    console.error('Erro ao garantir tabela account_payable_history:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

