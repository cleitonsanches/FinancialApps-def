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

db.all("PRAGMA table_info(proposals)", (err, columns) => {
  if (err) {
    console.error('Erro ao obter colunas:', err);
    db.close();
    return;
  }

  const hasObservacoes = columns.some(col => col.name === 'observacoes');

  if (hasObservacoes) {
    console.log('✅ A coluna "observacoes" já existe na tabela proposals');
    db.close();
    return;
  }

  // Adicionar coluna observacoes
  db.run(
    "ALTER TABLE proposals ADD COLUMN observacoes TEXT",
    (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Erro ao adicionar coluna observacoes:', err.message);
      } else {
        console.log('✅ Coluna "observacoes" adicionada com sucesso!');
      }
      db.close((closeErr) => {
        if (closeErr) {
          console.error('Erro ao fechar banco:', closeErr.message);
        } else {
          console.log('\n✅ Migração concluída!');
        }
      });
    }
  );
});

