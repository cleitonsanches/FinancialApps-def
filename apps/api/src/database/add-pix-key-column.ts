import { DataSource } from 'typeorm';
import { join } from 'path';

async function addPixKeyColumn() {
  const databasePath = join(process.cwd(), 'database.sqlite');
  
  console.log('Caminho do banco de dados:', databasePath);
  
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [],
    synchronize: false,
    logging: true,
  });

  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('Banco de dados conectado com sucesso!');
    
    const queryRunner = dataSource.createQueryRunner();
    
    // Verificar se a coluna já existe
    const table = await queryRunner.getTable('bank_accounts');
    
    if (!table) {
      console.error('Tabela bank_accounts não encontrada!');
      await dataSource.destroy();
      process.exit(1);
    }
    
    const hasPixKeyColumn = table.columns.find(col => col.name === 'pix_key');
    
    if (!hasPixKeyColumn) {
      console.log('Adicionando coluna pix_key à tabela bank_accounts...');
      await queryRunner.query(`
        ALTER TABLE bank_accounts 
        ADD COLUMN pix_key VARCHAR(255)
      `);
      console.log('✅ Coluna pix_key adicionada com sucesso!');
    } else {
      console.log('✅ Coluna pix_key já existe na tabela.');
    }
    
    await queryRunner.release();
    await dataSource.destroy();
    console.log('Conexão fechada.');
    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao adicionar coluna:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addPixKeyColumn();
}

export default addPixKeyColumn;

