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
      try {
        const columns = table.columns;
        
        // Verificar coluna id
        const idColumn = columns.find(col => col.name === 'id');
        if (idColumn) {
          const currentLength = typeof idColumn.length === 'string' ? parseInt(idColumn.length, 10) : (idColumn.length || 0);
          if (idColumn.type === 'varchar' && currentLength < 36) {
            console.log(`Corrigindo tamanho da coluna id de varchar(${currentLength || 'sem tamanho'}) para varchar(36)...`);
            try {
              await queryRunner.query(`ALTER TABLE "account_payable_history" ALTER COLUMN "id" varchar(36) NOT NULL`);
              console.log('✅ Coluna id corrigida com sucesso');
            } catch (error: any) {
              console.warn(`⚠️ Não foi possível alterar coluna id: ${error.message}`);
            }
          }
        }
        
        // Verificar coluna account_payable_id
        const accountPayableIdColumn = columns.find(col => col.name === 'account_payable_id');
        if (accountPayableIdColumn) {
          const currentLength = typeof accountPayableIdColumn.length === 'string' ? parseInt(accountPayableIdColumn.length, 10) : (accountPayableIdColumn.length || 0);
          if (accountPayableIdColumn.type === 'varchar' && currentLength < 36) {
            console.log(`Corrigindo tamanho da coluna account_payable_id de varchar(${currentLength || 'sem tamanho'}) para varchar(36)...`);
            try {
              await queryRunner.query(`ALTER TABLE "account_payable_history" ALTER COLUMN "account_payable_id" varchar(36) NOT NULL`);
              console.log('✅ Coluna account_payable_id corrigida com sucesso');
            } catch (error: any) {
              console.warn(`⚠️ Não foi possível alterar coluna account_payable_id: ${error.message}`);
            }
          }
        }
        
        // Verificar coluna changed_by
        const changedByColumn = columns.find(col => col.name === 'changed_by');
        if (changedByColumn) {
          const currentLength = typeof changedByColumn.length === 'string' ? parseInt(changedByColumn.length, 10) : (changedByColumn.length || 0);
          if (changedByColumn.type === 'varchar' && currentLength < 36) {
            console.log(`Corrigindo tamanho da coluna changed_by de varchar(${currentLength || 'sem tamanho'}) para varchar(36)...`);
            try {
              await queryRunner.query(`ALTER TABLE "account_payable_history" ALTER COLUMN "changed_by" varchar(36)`);
              console.log('✅ Coluna changed_by corrigida com sucesso');
            } catch (error: any) {
              console.warn(`⚠️ Não foi possível alterar coluna changed_by: ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        console.warn('⚠️ Erro ao verificar/corrigir colunas UUID:', error.message);
        // Não bloquear a inicialização se houver erro na migração
      }
    }
  } catch (error: any) {
    console.error('Erro ao garantir tabela account_payable_history:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

