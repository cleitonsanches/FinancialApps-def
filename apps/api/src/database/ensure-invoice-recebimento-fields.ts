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
    ];

    for (const col of columnsToAdd) {
      const hasColumn = table.columns.find(c => c.name === col.name);
      
      if (!hasColumn) {
        try {
          await queryRunner.query(`
            ALTER TABLE invoices ADD COLUMN ${col.name} ${col.type}
          `);
          console.log(`✅ Coluna ${col.name} adicionada`);
        } catch (error: any) {
          if (!error.message.includes('duplicate column')) {
            console.error(`Erro ao adicionar ${col.name}:`, error.message);
          }
        }
      }
    }
    
    // Criar índice para conta_corrente_id
    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS IX_invoices_conta_corrente_id ON invoices(conta_corrente_id)
      `);
      console.log('✅ Índice IX_invoices_conta_corrente_id criado ou já existe');
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
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

