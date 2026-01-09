const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o caminho do banco de dados
const possiblePaths = [
  path.join(__dirname, 'database.sqlite'),
  path.join(__dirname, 'apps', 'api', 'database.sqlite'),
  path.join(process.cwd(), 'database.sqlite'),
  path.join(process.cwd(), 'apps', 'api', 'database.sqlite'),
];

let dbPath = possiblePaths[0];
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    dbPath = p;
    break;
  }
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
  { name: 'is_cliente', type: 'BOOLEAN DEFAULT 0' },
  { name: 'is_fornecedor', type: 'BOOLEAN DEFAULT 0' },
  { name: 'is_colaborador', type: 'BOOLEAN DEFAULT 0' },
];

let completed = 0;
const total = columns.length;

columns.forEach((col) => {
  db.run(`ALTER TABLE clients ADD COLUMN ${col.name} ${col.type}`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error(`Erro ao adicionar ${col.name}:`, err.message);
    } else {
      console.log(`✅ Coluna ${col.name} adicionada ou já existe`);
    }
    
    completed++;
    if (completed === total) {
      db.close((err2) => {
        if (err2) {
          console.error('Erro ao fechar banco:', err2.message);
        } else {
          console.log('\n✅ Migração concluída!');
        }
      });
    }
  });
});
