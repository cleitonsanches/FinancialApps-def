const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o arquivo database.sqlite
let dbPath = path.join(process.cwd(), 'apps', 'api', 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(process.cwd(), 'database.sqlite');
}
if (!fs.existsSync(dbPath)) {
  console.error('❌ Arquivo database.sqlite não encontrado!');
  process.exit(1);
}

console.log(`📂 Usando banco de dados: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados SQLite');
});

// Verificar se a coluna já existe
db.all("PRAGMA table_info(proposals)", (err, columns) => {
  if (err) {
    console.error('❌ Erro ao verificar colunas:', err.message);
    db.close();
    process.exit(1);
  }

  const columnNames = columns.map(col => col.name);
  console.log('📋 Colunas existentes na tabela proposals:', columnNames.join(', '));

  if (columnNames.includes('parcelas')) {
    console.log('✅ Coluna parcelas já existe!');
    db.close();
    return;
  }

  console.log('\n📝 Adicionando coluna parcelas...');

  // Adicionar coluna parcelas como TEXT (para armazenar JSON)
  db.run("ALTER TABLE proposals ADD COLUMN parcelas TEXT", (err) => {
    if (err) {
      console.error('❌ Erro ao adicionar coluna parcelas:', err.message);
    } else {
      console.log('✅ Coluna parcelas adicionada com sucesso!');
    }
    db.close();
  });
});

