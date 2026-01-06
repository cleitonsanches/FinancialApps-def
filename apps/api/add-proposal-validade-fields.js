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

const columns = [
  { name: 'data_validade', type: 'DATE DEFAULT NULL' },
  { name: 'data_limite_aceite', type: 'DATE DEFAULT NULL' },
];

let completed = 0;
const total = columns.length;

columns.forEach((col) => {
  db.run(`ALTER TABLE proposals ADD COLUMN ${col.name} ${col.type}`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error(`Erro ao adicionar ${col.name}:`, err.message);
    } else {
      console.log(`✅ Coluna ${col.name} adicionada ou já existe`);
    }
    
    completed++;
    if (completed === total) {
      db.close((err3) => {
        if (err3) {
          console.error('Erro ao fechar banco:', err3.message);
        } else {
          console.log('\n✅ Migração concluída!');
        }
      });
    }
  });
});






