import { DataSource } from 'typeorm';

export async function ensureProposalValidadeFields(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    
    const table = await queryRunner.getTable('proposals');
    if (!table) {
      console.error('Tabela proposals não encontrada');
      return;
    }

    const columnsToAdd = [
      { name: 'data_validade', type: 'DATE' },
      { name: 'data_limite_aceite', type: 'DATE' },
    ];

    for (const col of columnsToAdd) {
      const hasColumn = table.columns.find(c => c.name === col.name);
      
      if (!hasColumn) {
        try {
          await queryRunner.query(`
            ALTER TABLE proposals ADD COLUMN ${col.name} ${col.type} DEFAULT NULL
          `);
          console.log(`✅ Coluna ${col.name} adicionada`);
        } catch (error: any) {
          if (!error.message.includes('duplicate column')) {
            console.error(`Erro ao adicionar ${col.name}:`, error.message);
          }
        }
      }
    }
    
    console.log('✅ Verificação de campos de validade concluída!');
  } catch (error: any) {
    console.error('Erro ao verificar campos de validade:', error.message);
  } finally {
    await queryRunner.release();
  }
}



