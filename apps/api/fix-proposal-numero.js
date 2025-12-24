const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 Procurando banco de dados...\n');

// Possíveis locais do banco de dados (mesma lógica do DatabaseConfig)
const possiblePaths = [
  path.join(__dirname, 'database.sqlite'), // apps/api/database.sqlite
  path.join(process.cwd(), 'database.sqlite'), // raiz do projeto
  path.join(process.cwd(), 'apps', 'api', 'database.sqlite'), // apps/api/database.sqlite (quando cwd é raiz)
  path.join(__dirname, '..', 'database.sqlite'), // raiz (quando __dirname é apps/api)
];

let dbPath = null;
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

console.log(`📂 Usando banco: ${dbPath}\n`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados\n');
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

  console.log('✅ Tabela proposals encontrada\n');

  // Verificar colunas existentes
  db.all("PRAGMA table_info(proposals)", (err, columns) => {
    if (err) {
      console.error('❌ Erro ao verificar colunas:', err.message);
      db.close();
      process.exit(1);
    }

    console.log('📋 Colunas existentes na tabela proposals:');
    columns.forEach(col => {
      console.log(`   - ${col.name} (${col.type})`);
    });
    console.log('');

    const hasNumeroColumn = columns.some(col => col.name === 'numero');

    if (hasNumeroColumn) {
      console.log('✅ Coluna numero já existe na tabela proposals');
      console.log('   Não é necessário adicionar.\n');
      db.close();
      return;
    }

    // Adicionar a coluna
    console.log('📝 Adicionando coluna numero à tabela proposals...');
    db.run('ALTER TABLE proposals ADD COLUMN numero VARCHAR(50)', function(err) {
      if (err) {
        console.error('❌ Erro ao adicionar coluna:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log('✅ Coluna numero adicionada com sucesso!');
      console.log(`   Rows affected: ${this.changes}\n`);
      
      // Verificar novamente
      db.all("PRAGMA table_info(proposals)", (err, newColumns) => {
        if (err) {
          console.error('❌ Erro ao verificar colunas após adição:', err.message);
          db.close();
          process.exit(1);
        }
        
        const hasNumeroNow = newColumns.some(col => col.name === 'numero');
        if (hasNumeroNow) {
          console.log('✅ Verificação: Coluna numero confirmada na tabela!');
          console.log('\n✅ Migração concluída com sucesso!');
        } else {
          console.error('❌ Erro: Coluna numero não foi adicionada corretamente!');
        }
        
        db.close();
      });
    });
  });
});

