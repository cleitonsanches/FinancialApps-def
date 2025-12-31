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

// Verificar se as colunas já existem
db.all("PRAGMA table_info(proposals)", (err, columns) => {
  if (err) {
    console.error('❌ Erro ao verificar colunas:', err.message);
    db.close();
    process.exit(1);
  }

  const columnNames = columns.map(col => col.name);
  console.log('📋 Colunas existentes na tabela proposals:', columnNames.join(', '));

  // Lista de colunas de data de status que precisam ser adicionadas
  const columnsToAdd = [
    { name: 'data_envio', type: 'DATE' },
    { name: 'data_re_envio', type: 'DATE' },
    { name: 'data_revisao', type: 'DATE' },
    { name: 'data_fechamento', type: 'DATE' },
    { name: 'data_declinio', type: 'DATE' },
    { name: 'data_cancelamento', type: 'DATE' },
  ];

  const columnsToAddFiltered = columnsToAdd.filter(col => !columnNames.includes(col.name));

  if (columnsToAddFiltered.length === 0) {
    console.log('✅ Todas as colunas de data de status já existem!');
    db.close();
    return;
  }

  console.log(`\n📝 Adicionando ${columnsToAddFiltered.length} coluna(s) de data de status...`);

  // Adicionar colunas uma por uma
  let completed = 0;
  columnsToAddFiltered.forEach((col, index) => {
    const sql = `ALTER TABLE proposals ADD COLUMN ${col.name} ${col.type}`;
    
    db.run(sql, (err) => {
      if (err) {
        console.error(`❌ Erro ao adicionar coluna ${col.name}:`, err.message);
      } else {
        console.log(`✅ Coluna ${col.name} adicionada com sucesso`);
      }
      
      completed++;
      if (completed === columnsToAddFiltered.length) {
        console.log('\n✅ Todas as colunas de data de status foram processadas!');
        db.close();
      }
    });
  });
});



