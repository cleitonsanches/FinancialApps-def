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

// Adicionar colunas
db.run('ALTER TABLE project_tasks ADD COLUMN usuario_responsavel_id VARCHAR(36)', (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Erro ao adicionar usuario_responsavel_id:', err.message);
  } else {
    console.log('Coluna usuario_responsavel_id adicionada ou já existe');
  }
  
  db.run('ALTER TABLE project_tasks ADD COLUMN usuario_executor_id VARCHAR(36)', (err2) => {
    if (err2 && !err2.message.includes('duplicate column')) {
      console.error('Erro ao adicionar usuario_executor_id:', err2.message);
    } else {
      console.log('Coluna usuario_executor_id adicionada ou já existe');
    }
    
    db.run('ALTER TABLE project_tasks ADD COLUMN horas_estimadas VARCHAR(20)', (err3) => {
      if (err3 && !err3.message.includes('duplicate column')) {
        console.error('Erro ao adicionar horas_estimadas:', err3.message);
      } else {
        console.log('Coluna horas_estimadas adicionada ou já existe');
      }
      
      db.close((err4) => {
        if (err4) {
          console.error('Erro ao fechar banco:', err4.message);
        } else {
          console.log('Migração concluída!');
        }
      });
    });
  });
});





