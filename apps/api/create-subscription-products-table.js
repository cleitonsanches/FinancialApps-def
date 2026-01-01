const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o arquivo database.sqlite
let dbPath = path.join(process.cwd(), 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(process.cwd(), 'apps', 'api', 'database.sqlite');
}
if (!fs.existsSync(dbPath)) {
  console.error('Arquivo database.sqlite não encontrado');
  process.exit(1);
}

console.log('Usando banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados');
});

// Criar tabela subscription_products
const createTableSQL = `
CREATE TABLE IF NOT EXISTS subscription_products (
  id VARCHAR(36) PRIMARY KEY,
  company_id VARCHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS IX_subscription_products_company_id ON subscription_products(company_id);
`;

db.exec(createTableSQL, (err) => {
  if (err) {
    console.error('Erro ao criar tabela subscription_products:', err.message);
  } else {
    console.log('✅ Tabela subscription_products criada ou já existe');
    console.log('✅ Índice IX_subscription_products_company_id criado ou já existe');
  }
  
  db.close((err2) => {
    if (err2) {
      console.error('Erro ao fechar banco:', err2.message);
    } else {
      console.log('\n✅ Migração concluída!');
    }
  });
});





