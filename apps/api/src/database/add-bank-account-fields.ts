import { DataSource } from 'typeorm';
import { join } from 'path';

async function addBankAccountFields() {
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
    
    // Verificar se as colunas já existem
    const table = await queryRunner.getTable('bank_accounts');
    const hasStatusColumn = table?.columns.find(col => col.name === 'status');
    const hasSaldoInicialColumn = table?.columns.find(col => col.name === 'saldo_inicial');
    const hasPixKeyColumn = table?.columns.find(col => col.name === 'pix_key');
    
    if (!hasStatusColumn) {
      console.log('Adicionando coluna status à tabela bank_accounts...');
      await queryRunner.query(`
        ALTER TABLE bank_accounts 
        ADD COLUMN status VARCHAR(20) DEFAULT 'ATIVA'
      `);
      console.log('Coluna status adicionada com sucesso!');
    } else {
      console.log('Coluna status já existe na tabela.');
    }
    
    if (!hasSaldoInicialColumn) {
      console.log('Adicionando coluna saldo_inicial à tabela bank_accounts...');
      await queryRunner.query(`
        ALTER TABLE bank_accounts 
        ADD COLUMN saldo_inicial DECIMAL(15,2) DEFAULT 0
      `);
      console.log('Coluna saldo_inicial adicionada com sucesso!');
    } else {
      console.log('Coluna saldo_inicial já existe na tabela.');
    }
    
    if (!hasPixKeyColumn) {
      console.log('Adicionando coluna pix_key à tabela bank_accounts...');
      await queryRunner.query(`
        ALTER TABLE bank_accounts 
        ADD COLUMN pix_key VARCHAR(255)
      `);
      console.log('Coluna pix_key adicionada com sucesso!');
    } else {
      console.log('Coluna pix_key já existe na tabela.');
    }
    
    await dataSource.destroy();
    console.log('Conexão fechada.');
  } catch (error) {
    console.error('Erro ao adicionar colunas:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addBankAccountFields();
}

export default addBankAccountFields;

