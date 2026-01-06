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

// Adicionar coluna motivo_cancelamento
db.run('ALTER TABLE proposals ADD COLUMN motivo_cancelamento TEXT', (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Erro ao adicionar motivo_cancelamento:', err.message);
  } else {
    console.log('Coluna motivo_cancelamento adicionada ou já existe');
  }
  
  // Adicionar coluna motivo_declinio
  db.run('ALTER TABLE proposals ADD COLUMN motivo_declinio TEXT', (err2) => {
    if (err2 && !err2.message.includes('duplicate column')) {
      console.error('Erro ao adicionar motivo_declinio:', err2.message);
    } else {
      console.log('Coluna motivo_declinio adicionada ou já existe');
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






