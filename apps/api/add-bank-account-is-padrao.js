const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o caminho do banco de dados
const possiblePaths = [
  path.join(__dirname, 'database.sqlite'), // apps/api/database.sqlite (quando executado de apps/api)
  path.join(process.cwd(), 'database.sqlite'), // raiz do projeto
  path.join(process.cwd(), 'apps', 'api', 'database.sqlite'), // apps/api/database.sqlite (quando cwd é raiz)
  path.join(__dirname, '..', 'database.sqlite'), // raiz (quando __dirname é apps/api)
  '/var/www/FinancialApps-def/apps/api/database.sqlite', // caminho absoluto no VPS
  '/var/www/FinancialApps-def/database.sqlite', // caminho absoluto na raiz do VPS
];

let dbPath = null;
console.log('🔍 Procurando banco de dados...\n');
for (const p of possiblePaths) {
  console.log(`  Verificando: ${p}`);
  if (fs.existsSync(p)) {
    dbPath = p;
    console.log(`  ✅ Encontrado em: ${p}\n`);
    break;
  }
}

if (!dbPath) {
  console.error('❌ Banco de dados não encontrado em nenhum dos locais:');
  possiblePaths.forEach(p => console.error(`   - ${p}`));
  process.exit(1);
}

console.log('📂 Usando banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados');
  
  // Verificar se a tabela existe
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='bank_accounts'", (err, rows) => {
    if (err) {
      console.error('Erro ao verificar tabelas:', err.message);
      db.close();
      process.exit(1);
    }
    
    if (rows.length === 0) {
      console.error('❌ Tabela bank_accounts não encontrada!');
      console.log('\n📋 Tabelas existentes no banco:');
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err2, allTables) => {
        if (err2) {
          console.error('Erro ao listar tabelas:', err2.message);
        } else {
          allTables.forEach(table => console.log(`  - ${table.name}`));
        }
        db.close();
        process.exit(1);
      });
      return;
    }
    
    console.log('✅ Tabela bank_accounts encontrada');
    
    // Verificar se a coluna já existe
    db.all("PRAGMA table_info(bank_accounts)", (err2, columns) => {
      if (err2) {
        console.error('Erro ao verificar colunas:', err2.message);
        db.close();
        process.exit(1);
      }
      
      const hasColumn = columns.some(col => col.name === 'is_padrao');
      if (hasColumn) {
        console.log('✅ Coluna is_padrao já existe');
        db.close();
        console.log('\n✅ Migração concluída!');
        return;
      }
      
      // Adicionar coluna is_padrao
      db.run(`ALTER TABLE bank_accounts ADD COLUMN is_padrao BOOLEAN DEFAULT 0`, (err3) => {
        if (err3) {
          console.error(`❌ Erro ao adicionar is_padrao:`, err3.message);
          db.close();
          process.exit(1);
        } else {
          console.log(`✅ Coluna is_padrao adicionada com sucesso`);
          db.close();
          console.log('\n✅ Migração concluída!');
        }
      });
    });
  });
});
