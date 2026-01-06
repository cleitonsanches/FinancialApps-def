const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('='.repeat(60));
console.log('🔧 Script para adicionar coluna numero à tabela proposals');
console.log('='.repeat(60));
console.log('');

// Encontrar o banco de dados
const searchPaths = [
  path.join(__dirname, 'database.sqlite'),
  path.join(process.cwd(), 'database.sqlite'),
  path.join(process.cwd(), 'apps', 'api', 'database.sqlite'),
  path.join(__dirname, '..', 'database.sqlite'),
];

console.log('🔍 Procurando banco de dados...');
let dbPath = null;

for (const searchPath of searchPaths) {
  const absPath = path.resolve(searchPath);
  console.log(`   Verificando: ${absPath}`);
  if (fs.existsSync(absPath)) {
    dbPath = absPath;
    console.log(`   ✅ ENCONTRADO: ${absPath}`);
    break;
  }
}

if (!dbPath) {
  console.error('');
  console.error('❌ ERRO: Banco de dados não encontrado!');
  console.error('');
  console.error('Locais verificados:');
  searchPaths.forEach(p => console.error(`   - ${path.resolve(p)}`));
  console.error('');
  console.error('Por favor, verifique se o banco de dados existe em um desses locais.');
  process.exit(1);
}

console.log('');
console.log(`📂 Usando banco: ${dbPath}`);
console.log('');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados');
  console.log('');
});

// Verificar tabela
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='proposals'", (err, row) => {
  if (err) {
    console.error('❌ Erro ao verificar tabela:', err.message);
    db.close();
    process.exit(1);
  }

  if (!row) {
    console.error('❌ Tabela "proposals" não encontrada!');
    db.close();
    process.exit(1);
  }

  console.log('✅ Tabela "proposals" encontrada');
  console.log('');

  // Listar colunas atuais
  db.all("PRAGMA table_info(proposals)", (err, columns) => {
    if (err) {
      console.error('❌ Erro ao listar colunas:', err.message);
      db.close();
      process.exit(1);
    }

    console.log('📋 Colunas atuais na tabela proposals:');
    columns.forEach((col, idx) => {
      console.log(`   ${idx + 1}. ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.dflt_value ? ', DEFAULT: ' + col.dflt_value : ''})`);
    });
    console.log('');

    const hasNumero = columns.some(c => c.name === 'numero');
    
    if (hasNumero) {
      console.log('✅ Coluna "numero" já existe!');
      console.log('');
      console.log('A coluna já está presente na tabela. O problema pode ser:');
      console.log('   1. O servidor está usando um banco diferente');
      console.log('   2. O servidor precisa ser reiniciado');
      console.log('   3. Há um cache do TypeORM');
      db.close();
      return;
    }

    console.log('⚠️  Coluna "numero" NÃO encontrada!');
    console.log('');
    console.log('📝 Adicionando coluna "numero"...');
    console.log('');

    db.run('ALTER TABLE proposals ADD COLUMN numero VARCHAR(50)', function(err) {
      if (err) {
        console.error('❌ ERRO ao adicionar coluna:', err.message);
        console.error('');
        console.error('Detalhes do erro:', err);
        db.close();
        process.exit(1);
      }

      console.log('✅ Coluna "numero" adicionada com sucesso!');
      console.log('');

      // Verificar novamente
      db.all("PRAGMA table_info(proposals)", (err, newColumns) => {
        if (err) {
          console.error('❌ Erro ao verificar após adição:', err.message);
          db.close();
          process.exit(1);
        }

        const hasNumeroNow = newColumns.some(c => c.name === 'numero');
        
        if (hasNumeroNow) {
          console.log('✅ VERIFICAÇÃO: Coluna "numero" confirmada!');
          console.log('');
          console.log('📋 Colunas após adição:');
          newColumns.forEach((col, idx) => {
            const marker = col.name === 'numero' ? ' ⭐ NOVA' : '';
            console.log(`   ${idx + 1}. ${col.name} (${col.type})${marker}`);
          });
          console.log('');
          console.log('='.repeat(60));
          console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
          console.log('='.repeat(60));
          console.log('');
          console.log('⚠️  IMPORTANTE: Reinicie o servidor da API agora!');
          console.log('');
        } else {
          console.error('❌ ERRO: Coluna não foi adicionada corretamente!');
        }

        db.close();
      });
    });
  });
});






