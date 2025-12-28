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

// Adicionar coluna chart_of_accounts_id
db.run('ALTER TABLE invoices ADD COLUMN chart_of_accounts_id VARCHAR(36)', (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Erro ao adicionar chart_of_accounts_id:', err.message);
  } else {
    console.log('✅ Coluna chart_of_accounts_id adicionada ou já existe');
  }
  
  // Criar índice
  db.run('CREATE INDEX IF NOT EXISTS IX_invoices_chart_of_accounts_id ON invoices(chart_of_accounts_id)', (err2) => {
    if (err2) {
      console.error('Erro ao criar índice:', err2.message);
    } else {
      console.log('✅ Índice IX_invoices_chart_of_accounts_id criado ou já existe');
    }
    
    db.close((err3) => {
      if (err3) {
        console.error('Erro ao fechar banco:', err3.message);
      } else {
        console.log('✅ Migração concluída!');
      }
    });
  });
});


