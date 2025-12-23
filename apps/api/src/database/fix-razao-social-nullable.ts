import { DataSource } from 'typeorm';
import { join } from 'path';

async function fixRazaoSocialNullable() {
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
    
    // Verificar se razao_social é NOT NULL
    const razaoSocialColumn = table.columns.find(col => col.name === 'razao_social');
    
    if (razaoSocialColumn && !razaoSocialColumn.isNullable) {
      console.log('A coluna razao_social está como NOT NULL. Corrigindo...');
      
      // SQLite não permite ALTER COLUMN diretamente, então precisamos recriar a tabela
      console.log('Criando tabela temporária...');
      
      // Criar nova tabela com estrutura correta
      await queryRunner.query(`
        CREATE TABLE clients_new (
          id VARCHAR(36) PRIMARY KEY,
          company_id VARCHAR(36) NOT NULL,
          name VARCHAR(255),
          razao_social VARCHAR(255),
          cnpj_cpf VARCHAR(18),
          contact_email VARCHAR(255),
          phone VARCHAR(20),
          address_street VARCHAR(255),
          address_number VARCHAR(20),
          address_complement VARCHAR(255),
          address_neighborhood VARCHAR(100),
          address_city VARCHAR(100),
          address_state VARCHAR(2),
          address_zipcode VARCHAR(10),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Copiando dados da tabela antiga para a nova...');
      
      // Copiar dados da tabela antiga para a nova
      await queryRunner.query(`
        INSERT INTO clients_new 
        SELECT 
          id,
          company_id,
          name,
          razao_social,
          cnpj_cpf,
          contact_email,
          phone,
          address_street,
          address_number,
          address_complement,
          address_neighborhood,
          address_city,
          address_state,
          address_zipcode,
          created_at,
          updated_at
        FROM clients
      `);
      
      console.log('Removendo tabela antiga...');
      await queryRunner.query(`DROP TABLE clients`);
      
      console.log('Renomeando tabela nova...');
      await queryRunner.query(`ALTER TABLE clients_new RENAME TO clients`);
      
      // Recriar índices
      console.log('Recriando índices...');
      await queryRunner.query(`CREATE INDEX IX_clients_company_id ON clients(company_id)`);
      
      console.log('✅ Coluna razao_social agora é nullable!');
    } else {
      console.log('✅ Coluna razao_social já é nullable ou não existe.');
    }
    
    await queryRunner.release();
    await dataSource.destroy();
    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao corrigir coluna razao_social:', error.message);
    console.error('Detalhes:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixRazaoSocialNullable();
}

export default fixRazaoSocialNullable;

