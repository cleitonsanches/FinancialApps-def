const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o arquivo database.sqlite
let dbPath = path.join(process.cwd(), 'apps', 'api', 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(process.cwd(), 'database.sqlite');
}
if (!fs.existsSync(dbPath)) {
  console.error('Arquivo database.sqlite não encontrado!');
  process.exit(1);
}

console.log('Usando banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Verificar se a tabela já existe
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='time_entries'", (err, row) => {
  if (err) {
    console.error('Erro ao verificar tabela:', err);
    db.close();
    process.exit(1);
  }

  if (row) {
    console.log('Tabela time_entries já existe');
    db.close();
    return;
  }

  // Criar tabela time_entries
  db.run(`
    CREATE TABLE IF NOT EXISTS time_entries (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      task_id TEXT,
      user_id TEXT,
      data TEXT NOT NULL,
      horas REAL NOT NULL,
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela time_entries:', err);
      db.close();
      process.exit(1);
    }
    console.log('Tabela time_entries criada com sucesso!');
    
    // Criar índices
    db.run('CREATE INDEX IF NOT EXISTS IX_time_entries_project_id ON time_entries(project_id)', (err) => {
      if (err) console.error('Erro ao criar índice project_id:', err);
    });
    
    db.run('CREATE INDEX IF NOT EXISTS IX_time_entries_task_id ON time_entries(task_id)', (err) => {
      if (err) console.error('Erro ao criar índice task_id:', err);
    });
    
    db.close();
    console.log('Migração concluída!');
  });
});





