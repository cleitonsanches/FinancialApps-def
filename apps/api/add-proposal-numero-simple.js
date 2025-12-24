const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho do banco de dados - pode estar na raiz ou em apps/api
const possiblePaths = [
  path.join(__dirname, 'database.sqlite'),
  path.join(__dirname, '..', 'database.sqlite'),
];

let dbPath = possiblePaths[0];
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    dbPath = p;
    break;
  }
}

console.log('🔍 Procurando banco de dados em:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Banco de dados não encontrado em:', dbPath);
  process.exit(1);
}

console.log('✅ Banco de dados encontrado!');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados');
});

// Verificar se a tabela existe
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='proposals'", (err, row) => {
  if (err) {
    console.error('❌ Erro ao verificar tabela:', err.message);
    db.close();
    process.exit(1);
  }

  if (!row) {
    console.error('❌ Tabela proposals não encontrada!');
    db.close();
    process.exit(1);
  }

  // Verificar se a coluna já existe
  db.all("PRAGMA table_info(proposals)", (err, columns) => {
    if (err) {
      console.error('❌ Erro ao verificar colunas:', err.message);
      db.close();
      process.exit(1);
    }

    const hasNumeroColumn = columns.some(col => col.name === 'numero');

    if (hasNumeroColumn) {
      console.log('✅ Coluna numero já existe na tabela proposals');
      db.close();
      return;
    }

    // Adicionar a coluna
    console.log('📝 Adicionando coluna numero à tabela proposals...');
    db.run('ALTER TABLE proposals ADD COLUMN numero VARCHAR(50)', (err) => {
      if (err) {
        console.error('❌ Erro ao adicionar coluna:', err.message);
        db.close();
        process.exit(1);
      }
      console.log('✅ Coluna numero adicionada com sucesso!');
      console.log('\n✅ Migração concluída com sucesso!');
      db.close();
    });
  });
});

