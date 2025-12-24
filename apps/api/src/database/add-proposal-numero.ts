import { DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';

async function addProposalNumero() {
  // O banco está em apps/api/database.sqlite
  const possiblePaths = [
    join(process.cwd(), 'apps', 'api', 'database.sqlite'),
    join(process.cwd(), 'database.sqlite'),
    join(__dirname, '..', '..', 'database.sqlite'),
  ];
  
  let databasePath = possiblePaths[0];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      databasePath = p;
      break;
    }
  }
  
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
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('proposals');
    
    if (!table) {
      console.error('Tabela proposals não encontrada!');
      await dataSource.destroy();
      process.exit(1);
    }
    
    // Verificar se a coluna já existe
    const numeroColumn = table.columns.find(col => col.name === 'numero');
    
    if (!numeroColumn) {
      console.log('Adicionando coluna numero à tabela proposals...');
      await queryRunner.query(`ALTER TABLE proposals ADD COLUMN numero VARCHAR(50)`);
      console.log('✅ Coluna numero adicionada com sucesso!');
    } else {
      console.log('✅ Coluna numero já existe na tabela.');
    }
    
    await queryRunner.release();
    await dataSource.destroy();
    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao adicionar coluna numero:', error.message);
    console.error('Detalhes:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addProposalNumero();
}

export default addProposalNumero;

