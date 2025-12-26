const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o arquivo database.sqlite
let dbPath = path.join(__dirname, 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(process.cwd(), 'apps', 'api', 'database.sqlite');
}
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(process.cwd(), 'database.sqlite');
}

console.log('Procurando database em:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Arquivo database.sqlite não encontrado!');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados');
});

// Função para verificar se uma coluna existe
function columnExists(tableName, columnName, callback) {
  db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
    if (err) {
      callback(err, false);
      return;
    }
    const exists = rows.some(row => row.name === columnName);
    callback(null, exists);
  });
}

// Adicionar coluna exigir_lancamento_horas
columnExists('project_tasks', 'exigir_lancamento_horas', (err, exists) => {
  if (err) {
    console.error('❌ Erro ao verificar coluna:', err);
    db.close();
    process.exit(1);
  }
  
  if (!exists) {
    console.log('📝 Adicionando coluna exigir_lancamento_horas...');
    db.run(`ALTER TABLE project_tasks ADD COLUMN exigir_lancamento_horas INTEGER DEFAULT 0`, (err) => {
      if (err) {
        console.error('❌ Erro ao adicionar coluna:', err);
        db.close();
        process.exit(1);
      }
      console.log('✅ Coluna exigir_lancamento_horas adicionada');
      db.close();
    });
  } else {
    console.log('✅ Coluna exigir_lancamento_horas já existe');
    db.close();
  }
});

