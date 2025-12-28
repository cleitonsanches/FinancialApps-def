/**
 * Script para tornar a coluna client_id nullable na tabela projects
 * 
 * SQLite não suporta ALTER COLUMN, então precisamos recriar a tabela
 * 
 * Execute: node make-project-client-nullable.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Caminho do banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');

if (!fs.existsSync(dbPath)) {
  console.error('❌ Banco de dados não encontrado em:', dbPath);
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados');
});

db.serialize(() => {
  db.run('BEGIN TRANSACTION;', (err) => {
    if (err) {
      console.error('❌ Erro ao iniciar transação:', err.message);
      db.close();
      process.exit(1);
    }

    console.log('🔧 Criando tabela temporária...');
    
    // Criar tabela temporária com client_id nullable
    db.run(`
      CREATE TABLE projects_temp (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        client_id TEXT,
        proposal_id TEXT,
        template_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        service_type TEXT,
        data_inicio TEXT,
        data_fim TEXT,
        status TEXT NOT NULL DEFAULT 'PENDENTE',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `, (err) => {
      if (err) {
        console.error('❌ Erro ao criar tabela temporária:', err.message);
        db.run('ROLLBACK;');
        db.close();
        process.exit(1);
      }

      console.log('📋 Copiando dados...');
      
      // Copiar dados da tabela antiga para a nova
      db.run(`
        INSERT INTO projects_temp 
        SELECT 
          id,
          company_id,
          client_id,
          proposal_id,
          template_id,
          name,
          description,
          service_type,
          data_inicio,
          data_fim,
          status,
          created_at,
          updated_at
        FROM projects;
      `, (err) => {
        if (err) {
          console.error('❌ Erro ao copiar dados:', err.message);
          db.run('ROLLBACK;');
          db.close();
          process.exit(1);
        }

        console.log('🗑️  Removendo tabela antiga...');
        
        // Dropar tabela antiga
        db.run('DROP TABLE projects;', (err) => {
          if (err) {
            console.error('❌ Erro ao remover tabela antiga:', err.message);
            db.run('ROLLBACK;');
            db.close();
            process.exit(1);
          }

          console.log('🔄 Renomeando tabela temporária...');
          
          // Renomear tabela temporária
          db.run('ALTER TABLE projects_temp RENAME TO projects;', (err) => {
            if (err) {
              console.error('❌ Erro ao renomear tabela:', err.message);
              db.run('ROLLBACK;');
              db.close();
              process.exit(1);
            }

            console.log('📊 Recriando índices...');
            
            // Recriar índices
            db.run('CREATE INDEX IF NOT EXISTS IX_projects_company_id ON projects(company_id);', (err) => {
              if (err) {
                console.error('❌ Erro ao criar índice company_id:', err.message);
                db.run('ROLLBACK;');
                db.close();
                process.exit(1);
              }

              db.run('CREATE INDEX IF NOT EXISTS IX_projects_proposal_id ON projects(proposal_id);', (err) => {
                if (err) {
                  console.error('❌ Erro ao criar índice proposal_id:', err.message);
                  db.run('ROLLBACK;');
                  db.close();
                  process.exit(1);
                }

                console.log('✅ Commitando alterações...');
                
                // Commit
                db.run('COMMIT;', (err) => {
                  if (err) {
                    console.error('❌ Erro ao fazer commit:', err.message);
                    db.run('ROLLBACK;');
                    db.close();
                    process.exit(1);
                  }

                  console.log('✅ Coluna client_id agora é nullable na tabela projects!');
                  db.close();
                });
              });
            });
          });
        });
      });
    });
  });
});

