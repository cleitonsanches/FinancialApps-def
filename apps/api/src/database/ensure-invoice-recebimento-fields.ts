import { DataSource } from 'typeorm';

export async function ensureInvoiceRecebimentoFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    const table = await queryRunner.getTable('invoices');
    if (!table) {
      console.error('Tabela invoices não encontrada');
      return;
    }

    const columnsToAdd = [
      { name: 'tipo_emissao', type: 'VARCHAR(10)' },
      { name: 'desconto', type: 'DECIMAL(15,2) DEFAULT 0' },
      { name: 'acrescimo', type: 'DECIMAL(15,2) DEFAULT 0' },
      { name: 'conta_corrente_id', type: 'VARCHAR(36)' },
      { name: 'valor_recebido', type: 'DECIMAL(15,2)' },
    ];

    for (const col of columnsToAdd) {
      const hasColumn = table.columns.find(c => c.name === col.name);
      
      if (!hasColumn) {
        try {
          // SQL Server não aceita COLUMN na sintaxe ALTER TABLE ADD
          const sqlType = col.type.includes('DEFAULT') ? col.type : `${col.type} NULL`;
          await queryRunner.query(`
            ALTER TABLE invoices ADD ${col.name} ${sqlType}
          `);
          console.log(`✅ Coluna ${col.name} adicionada`);
        } catch (error: any) {
          if (!error.message.includes('duplicate column') && !error.message.includes('already exists')) {
            console.error(`Erro ao adicionar ${col.name}:`, error.message);
          }
        }
      }
    }
    
    // Criar índice para conta_corrente_id (se não existir)
    try {
      const table = await queryRunner.getTable('invoices');
      const indexExists = table?.indices?.some(idx => idx.name === 'IX_invoices_conta_corrente_id');
      
      if (!indexExists) {
        const dbType = dataSource.options.type;
        if (dbType === 'mssql') {
          // SQL Server: verifica se existe antes de criar (usando EXEC para permitir IF)
          const indexCheck = await queryRunner.query(`
            SELECT COUNT(*) as count
            FROM sys.indexes 
            WHERE name = 'IX_invoices_conta_corrente_id' 
            AND object_id = OBJECT_ID('invoices')
          `);
          
          if (indexCheck[0]?.count === 0) {
            await queryRunner.query(`
              CREATE INDEX IX_invoices_conta_corrente_id ON invoices(conta_corrente_id)
            `);
            console.log('✅ Índice IX_invoices_conta_corrente_id criado');
          } else {
            console.log('✅ Índice IX_invoices_conta_corrente_id já existe');
          }
        } else {
          // SQLite/PostgreSQL: usa IF NOT EXISTS
          await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS IX_invoices_conta_corrente_id ON invoices(conta_corrente_id)
          `);
          console.log('✅ Índice IX_invoices_conta_corrente_id criado');
        }
      } else {
        console.log('✅ Índice IX_invoices_conta_corrente_id já existe');
      }
    } catch (error: any) {
      // Ignora se já existe
      if (!error.message.includes('already exists') && !error.message.includes('duplicate') && !error.message.includes('There is already an index') && !error.message.includes('is already an index')) {
        console.error('Erro ao criar índice:', error.message);
      }
    }
    
    console.log('✅ Verificação de campos de recebimento concluída!');
  } catch (error: any) {
    console.error('Erro ao verificar campos de recebimento:', error.message);
  } finally {
    await queryRunner.release();
  }
}





