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

console.log('🔍 Analisando duplicatas de Honorários...\n');

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
  WHERE name LIKE 'Honorários%' AND type = 'RECEITA'
  ORDER BY name, code, created_at
`, (err, rows) => {
  if (err) {
    console.error('Erro ao buscar classificações:', err);
    db.close();
    process.exit(1);
  }
  
  if (rows.length === 0) {
    console.log('Nenhuma classificação de Honorários encontrada.');
    db.close();
    return;
  }
  
  console.log(`Encontradas ${rows.length} classificações de Honorários.\n`);
  
  // Agrupar por nome normalizado (sem diferenças de maiúsculas/minúsculas e espaços)
  const groupedByName = {};
  rows.forEach(row => {
    // Normalizar nome: remover espaços extras, converter para minúsculas
    const normalizedName = row.name.toLowerCase().trim().replace(/\s+/g, ' ');
    if (!groupedByName[normalizedName]) {
      groupedByName[normalizedName] = [];
    }
    groupedByName[normalizedName].push(row);
  });
  
  // Identificar duplicatas
  const duplicates = Object.entries(groupedByName).filter(([name, items]) => items.length > 1);
  
  if (duplicates.length === 0) {
    console.log('✅ Nenhuma duplicata encontrada.\n');
    db.close();
    return;
  }
  
  console.log(`⚠️  Encontradas ${duplicates.length} duplicata(s):\n`);
  
  const idsToDelete = [];
  
  duplicates.forEach(([normalizedName, items]) => {
    console.log(`\n"${items[0].name}" (${items.length} registros):`);
    
    // Ordenar por data de criação (manter o mais antigo) ou por código (manter o que tem código)
    items.sort((a, b) => {
      // Priorizar registros com código
      if (a.code && !b.code) return -1;
      if (!a.code && b.code) return 1;
      // Se ambos têm código ou ambos não têm, ordenar por data de criação
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });
    
    // Manter o primeiro (mais antigo ou com código)
    const keep = items[0];
    const remove = items.slice(1);
    
    console.log(`  ✅ MANTER: ID ${keep.id} - Código: ${keep.code || '(sem código)'} - Criado: ${keep.created_at}`);
    
    remove.forEach(item => {
      console.log(`  ❌ REMOVER: ID ${item.id} - Código: ${item.code || '(sem código)'} - Criado: ${item.created_at}`);
      idsToDelete.push(item.id);
    });
  });
  
  if (idsToDelete.length > 0) {
    console.log(`\n\n📋 Resumo: ${idsToDelete.length} registro(s) serão removidos.`);
    console.log('\n⚠️  ATENÇÃO: Esta operação é irreversível!');
    console.log('Para executar a remoção, descomente as linhas abaixo no código.\n');
    
    // Verificar se há invoices vinculadas antes de deletar
    db.all(`
      SELECT chart_of_accounts_id, COUNT(*) as count
      FROM invoices
      WHERE chart_of_accounts_id IN (${idsToDelete.map(() => '?').join(',')})
      GROUP BY chart_of_accounts_id
    `, idsToDelete, (err, invoiceCounts) => {
      if (err) {
        console.error('Erro ao verificar invoices:', err);
      } else if (invoiceCounts.length > 0) {
        console.log('\n⚠️  ATENÇÃO: Há invoices vinculadas a estas classificações:');
        invoiceCounts.forEach(item => {
          console.log(`  - Classificação ${item.chart_of_accounts_id}: ${item.count} invoice(s)`);
        });
        console.log('\n⚠️  Não é recomendado deletar classificações com invoices vinculadas!');
      }
      
      // CÓDIGO PARA DELETAR (descomente para executar):
      /*
      console.log('\n🗑️  Removendo duplicatas...');
      const placeholders = idsToDelete.map(() => '?').join(',');
      db.run(`
        DELETE FROM chart_of_accounts
        WHERE id IN (${placeholders})
      `, idsToDelete, function(err) {
        if (err) {
          console.error('Erro ao remover duplicatas:', err);
        } else {
          console.log(`✅ ${this.changes} registro(s) removido(s) com sucesso!`);
        }
        db.close();
      });
      */
      
      // Se não executar a remoção, apenas fechar
      db.close();
    });
  } else {
    db.close();
  }
});

