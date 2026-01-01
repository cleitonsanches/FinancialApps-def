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

// Função para tornar project_id nullable (SQLite não suporta ALTER COLUMN diretamente)
// Vamos criar uma nova tabela, copiar dados, e substituir
function makeProjectIdNullable(callback) {
  console.log('\n📝 Tornando project_id nullable...');
  
  db.serialize(() => {
    // Verificar se já é nullable (verificando se a constraint NOT NULL existe)
    db.all(`PRAGMA table_info(project_tasks)`, (err, rows) => {
      if (err) {
        console.error('❌ Erro ao verificar estrutura:', err);
        callback(err);
        return;
      }
      
      const projectIdColumn = rows.find(r => r.name === 'project_id');
      if (projectIdColumn && projectIdColumn.notnull === 0) {
        console.log('✅ project_id já é nullable');
        callback(null);
        return;
      }
      
      // Criar nova tabela temporária
      db.run(`
        CREATE TABLE project_tasks_new (
          id TEXT PRIMARY KEY,
          project_id TEXT,
          proposal_id TEXT,
          client_id TEXT,
          name TEXT NOT NULL,
          description TEXT,
          data_inicio TEXT,
          data_conclusao TEXT,
          status TEXT DEFAULT 'PENDENTE',
          ordem INTEGER DEFAULT 0,
          usuario_responsavel_id TEXT,
          usuario_executor_id TEXT,
          horas_estimadas TEXT,
          tipo TEXT DEFAULT 'ATIVIDADE',
          hora_inicio TEXT,
          hora_fim TEXT,
          sem_prazo_definido INTEGER DEFAULT 0,
          dia_inteiro INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela temporária:', err);
          callback(err);
          return;
        }
        
        // Copiar dados
        db.run(`
          INSERT INTO project_tasks_new 
          SELECT * FROM project_tasks
        `, (err) => {
          if (err) {
            console.error('❌ Erro ao copiar dados:', err);
            callback(err);
            return;
          }
          
          // Remover tabela antiga
          db.run(`DROP TABLE project_tasks`, (err) => {
            if (err) {
              console.error('❌ Erro ao remover tabela antiga:', err);
              callback(err);
              return;
            }
            
            // Renomear nova tabela
            db.run(`ALTER TABLE project_tasks_new RENAME TO project_tasks`, (err) => {
              if (err) {
                console.error('❌ Erro ao renomear tabela:', err);
                callback(err);
                return;
              }
              
              console.log('✅ project_id agora é nullable');
              callback(null);
            });
          });
        });
      });
    });
  });
}

// Adicionar colunas proposal_id e client_id
function addColumns(callback) {
  console.log('\n📝 Adicionando colunas proposal_id e client_id...');
  
  columnExists('project_tasks', 'proposal_id', (err, exists) => {
    if (err) {
      callback(err);
      return;
    }
    
    if (!exists) {
      db.run(`ALTER TABLE project_tasks ADD COLUMN proposal_id TEXT`, (err) => {
        if (err) {
          console.error('❌ Erro ao adicionar proposal_id:', err);
          callback(err);
          return;
        }
        console.log('✅ Coluna proposal_id adicionada');
        
        columnExists('project_tasks', 'client_id', (err2, exists2) => {
          if (err2) {
            callback(err2);
            return;
          }
          
          if (!exists2) {
            db.run(`ALTER TABLE project_tasks ADD COLUMN client_id TEXT`, (err3) => {
              if (err3) {
                console.error('❌ Erro ao adicionar client_id:', err3);
                callback(err3);
                return;
              }
              console.log('✅ Coluna client_id adicionada');
              callback(null);
            });
          } else {
            console.log('✅ Coluna client_id já existe');
            callback(null);
          }
        });
      });
    } else {
      console.log('✅ Coluna proposal_id já existe');
      
      columnExists('project_tasks', 'client_id', (err2, exists2) => {
        if (err2) {
          callback(err2);
          return;
        }
        
        if (!exists2) {
          db.run(`ALTER TABLE project_tasks ADD COLUMN client_id TEXT`, (err3) => {
            if (err3) {
              console.error('❌ Erro ao adicionar client_id:', err3);
              callback(err3);
              return;
            }
            console.log('✅ Coluna client_id adicionada');
            callback(null);
          });
        } else {
          console.log('✅ Coluna client_id já existe');
          callback(null);
        }
      });
    }
  });
}

// Executar migrações
db.serialize(() => {
  makeProjectIdNullable((err) => {
    if (err) {
      console.error('❌ Erro na migração:', err);
      db.close();
      process.exit(1);
    }
    
    addColumns((err2) => {
      if (err2) {
        console.error('❌ Erro na migração:', err2);
        db.close();
        process.exit(1);
      }
      
      console.log('\n✅ Migração concluída com sucesso!');
      db.close();
    });
  });
});





