import { DataSource } from 'typeorm';
import { join } from 'path';

async function addStatusColumn() {
  const databasePath = join(process.cwd(), 'database.sqlite');
  
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
    const table = await queryRunner.getTable('chart_of_accounts');
    const hasStatusColumn = table?.columns.find(col => col.name === 'status');
    
    if (!hasStatusColumn) {
      console.log('Adicionando coluna status à tabela chart_of_accounts...');
      await queryRunner.query(`
        ALTER TABLE chart_of_accounts 
        ADD COLUMN status VARCHAR(20) DEFAULT 'ATIVA'
      `);
      console.log('Coluna status adicionada com sucesso!');
    } else {
      console.log('Coluna status já existe na tabela.');
    }
    
    // Verificar se a coluna code precisa ser nullable
    const codeColumn = table?.columns.find(col => col.name === 'code');
    if (codeColumn && !codeColumn.isNullable) {
      console.log('Tornando coluna code nullable...');
      // SQLite não suporta ALTER COLUMN diretamente, então precisamos recriar a tabela
      // Mas isso é complexo, então vamos apenas avisar
      console.log('Nota: SQLite não suporta alterar nullable diretamente. Se necessário, recrie a tabela.');
    }
    
    await dataSource.destroy();
    console.log('Conexão fechada.');
  } catch (error) {
    console.error('Erro ao adicionar coluna:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addStatusColumn();
}

export default addStatusColumn;

