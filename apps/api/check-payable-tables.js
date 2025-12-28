const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o arquivo database.sqlite
let dbPath = path.join(__dirname, 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(__dirname, 'src', 'database', 'database.sqlite');
}
if (!fs.existsSync(dbPath)) {
  console.log('Arquivo database.sqlite não encontrado');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
    process.exit(1);
  }
});

// Buscar tabelas relacionadas a contas a pagar
db.all(`
  SELECT name, sql 
  FROM sqlite_master 
  WHERE type='table' 
  AND (
    name LIKE '%payable%' 
    OR name LIKE '%pagar%' 
    OR name LIKE '%expense%' 
    OR name LIKE '%despesa%'
  )
  ORDER BY name
`, (err, rows) => {
  if (err) {
    console.error('Erro ao buscar tabelas:', err);
    db.close();
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log('Nenhuma tabela de contas a pagar encontrada no banco de dados.');
  } else {
    console.log(`\nEncontradas ${rows.length} tabela(s) relacionada(s) a contas a pagar:\n`);
    rows.forEach((row, index) => {
      console.log(`\n${index + 1}. Tabela: ${row.name}`);
      console.log('SQL de criação:');
      console.log(row.sql || 'SQL não disponível');
      
      // Buscar colunas da tabela
      db.all(`PRAGMA table_info(${row.name})`, (err, columns) => {
        if (!err && columns) {
          console.log('\nColunas:');
          columns.forEach(col => {
            console.log(`  - ${col.name} (${col.type}${col.notnull ? ', NOT NULL' : ''}${col.dflt_value ? `, DEFAULT: ${col.dflt_value}` : ''})`);
          });
        }
      });
    });
  }
  
  // Aguardar um pouco para as queries assíncronas terminarem
  setTimeout(() => {
    db.close();
  }, 1000);
});

