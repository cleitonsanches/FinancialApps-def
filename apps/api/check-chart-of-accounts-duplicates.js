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

// Buscar todas as classificações de Honorários
db.all(`
  SELECT 
    id,
    company_id,
    code,
    name,
    type,
    status,
    created_at
  FROM chart_of_accounts
  WHERE name LIKE 'Honorários%'
  ORDER BY name, code, created_at
`, (err, rows) => {
  if (err) {
    console.error('Erro ao buscar classificações:', err);
    db.close();
    process.exit(1);
  }
  
  console.log(`\nEncontradas ${rows.length} classificações de Honorários:\n`);
  
  // Agrupar por nome para identificar duplicatas
  const groupedByName = {};
  rows.forEach(row => {
    const key = row.name.toLowerCase().trim();
    if (!groupedByName[key]) {
      groupedByName[key] = [];
    }
    groupedByName[key].push(row);
  });
  
  // Identificar duplicatas
  const duplicates = Object.entries(groupedByName).filter(([name, items]) => items.length > 1);
  
  if (duplicates.length > 0) {
    console.log('⚠️  DUPLICATAS ENCONTRADAS:\n');
    duplicates.forEach(([name, items]) => {
      console.log(`\n"${items[0].name}" (${items.length} registros):`);
      items.forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}`);
        console.log(`     Código: ${item.code || '(sem código)'}`);
        console.log(`     Tipo: ${item.type}`);
        console.log(`     Status: ${item.status}`);
        console.log(`     Criado em: ${item.created_at}`);
        console.log(`     Company ID: ${item.company_id}`);
        console.log('');
      });
    });
  } else {
    console.log('✅ Nenhuma duplicata encontrada por nome exato.');
  }
  
  // Verificar variações de nomes similares
  console.log('\n📊 RESUMO POR NOME:\n');
  Object.entries(groupedByName).forEach(([name, items]) => {
    console.log(`"${items[0].name}": ${items.length} registro(s)`);
    items.forEach(item => {
      console.log(`  - Código: ${item.code || '(sem código)'}, ID: ${item.id.substring(0, 8)}...`);
    });
  });
  
  // Verificar códigos duplicados
  const groupedByCode = {};
  rows.forEach(row => {
    if (row.code) {
      const key = row.code.toUpperCase().trim();
      if (!groupedByCode[key]) {
        groupedByCode[key] = [];
      }
      groupedByCode[key].push(row);
    }
  });
  
  const duplicateCodes = Object.entries(groupedByCode).filter(([code, items]) => items.length > 1);
  
  if (duplicateCodes.length > 0) {
    console.log('\n⚠️  CÓDIGOS DUPLICADOS:\n');
    duplicateCodes.forEach(([code, items]) => {
      console.log(`Código "${code}" (${items.length} registros):`);
      items.forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.name}" - ID: ${item.id.substring(0, 8)}...`);
      });
    });
  }
  
  db.close();
});

