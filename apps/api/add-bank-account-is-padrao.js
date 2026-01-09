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

// Adicionar coluna is_padrao
db.run(`ALTER TABLE bank_accounts ADD COLUMN is_padrao BOOLEAN DEFAULT 0`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error(`Erro ao adicionar is_padrao:`, err.message);
  } else {
    console.log(`✅ Coluna is_padrao adicionada ou já existe`);
  }
  
  db.close((err2) => {
    if (err2) {
      console.error('Erro ao fechar banco:', err2.message);
    } else {
      console.log('\n✅ Migração concluída!');
    }
  });
});
