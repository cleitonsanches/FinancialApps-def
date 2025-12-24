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

// Adicionar coluna data_recebimento
db.run('ALTER TABLE invoices ADD COLUMN data_recebimento DATE', (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Erro ao adicionar data_recebimento:', err.message);
  } else {
    console.log('Coluna data_recebimento adicionada ou já existe');
  }
  
  // Adicionar coluna numero_nf
  db.run('ALTER TABLE invoices ADD COLUMN numero_nf VARCHAR(50)', (err2) => {
    if (err2 && !err2.message.includes('duplicate column')) {
      console.error('Erro ao adicionar numero_nf:', err2.message);
    } else {
      console.log('Coluna numero_nf adicionada ou já existe');
    }
    
    db.close((err3) => {
      if (err3) {
        console.error('Erro ao fechar banco:', err3.message);
      } else {
        console.log('Migração concluída!');
      }
    });
  });
});

