import { DataSource } from 'typeorm';
import { join } from 'path';

async function addClientFields() {
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
    
    // Verificar se a tabela existe
    const table = await queryRunner.getTable('clients');
    
    if (!table) {
      console.error('Tabela clients não encontrada!');
      await dataSource.destroy();
      process.exit(1);
    }
    
    const fieldsToAdd = [
      { name: 'name', type: 'VARCHAR(255)', nullable: true },
      { name: 'phone', type: 'VARCHAR(20)', nullable: true },
      { name: 'address_street', type: 'VARCHAR(255)', nullable: true },
      { name: 'address_number', type: 'VARCHAR(20)', nullable: true },
      { name: 'address_complement', type: 'VARCHAR(255)', nullable: true },
      { name: 'address_neighborhood', type: 'VARCHAR(100)', nullable: true },
      { name: 'address_city', type: 'VARCHAR(100)', nullable: true },
      { name: 'address_state', type: 'VARCHAR(2)', nullable: true },
      { name: 'address_zipcode', type: 'VARCHAR(10)', nullable: true },
    ];
    
    for (const field of fieldsToAdd) {
      const hasColumn = table.columns.find(col => col.name === field.name);
      
      if (!hasColumn) {
        console.log(`Adicionando coluna ${field.name} à tabela clients...`);
        const sql = `ALTER TABLE clients ADD COLUMN ${field.name} ${field.type}`;
        await queryRunner.query(sql);
        console.log(`✅ Coluna ${field.name} adicionada com sucesso!`);
      } else {
        console.log(`✅ Coluna ${field.name} já existe na tabela.`);
      }
    }
    
    // Tornar razao_social nullable se ainda não for
    const razaoSocialColumn = table.columns.find(col => col.name === 'razao_social');
    if (razaoSocialColumn && !razaoSocialColumn.isNullable) {
      console.log('Nota: SQLite não suporta alterar nullable diretamente. Se necessário, recrie a tabela.');
    }
    
    await queryRunner.release();
    await dataSource.destroy();
    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao adicionar colunas:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addClientFields();
}

export default addClientFields;

