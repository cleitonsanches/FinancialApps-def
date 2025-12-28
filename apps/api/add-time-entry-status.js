const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o arquivo database.sqlite
let dbPath = path.join(__dirname, 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(__dirname, '..', 'database.sqlite');
}
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(process.cwd(), 'apps', 'api', 'database.sqlite');
}
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(process.cwd(), 'database.sqlite');
}

console.log('Usando banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Verificar se a coluna já existe
db.get("PRAGMA table_info(time_entries)", (err, rows) => {
  if (err) {
    console.error('Erro ao verificar colunas:', err);
    db.close();
    process.exit(1);
  }

  db.all("PRAGMA table_info(time_entries)", (err, columns) => {
    if (err) {
      console.error('Erro ao listar colunas:', err);
      db.close();
      process.exit(1);
    }

    const hasStatus = columns.some(col => col.name === 'status');
    
    if (hasStatus) {
      console.log('Coluna status já existe na tabela time_entries');
      db.close();
      return;
    }

    // Adicionar coluna status
    db.run(`
      ALTER TABLE time_entries 
      ADD COLUMN status TEXT DEFAULT 'PENDENTE'
    `, (err) => {
      if (err) {
        console.error('Erro ao adicionar coluna status:', err);
        db.close();
        process.exit(1);
      }
      console.log('✅ Coluna status adicionada com sucesso!');
      
      // Atualizar registros existentes para PENDENTE
      db.run(`
        UPDATE time_entries 
        SET status = 'PENDENTE' 
        WHERE status IS NULL
      `, (err) => {
        if (err) {
          console.error('Erro ao atualizar registros existentes:', err);
        } else {
          console.log('✅ Registros existentes atualizados para PENDENTE');
        }
        db.close();
        console.log('Migração concluída!');
      });
    });
  });
});

