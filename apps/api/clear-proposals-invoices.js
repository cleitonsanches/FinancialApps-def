const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o arquivo database.sqlite
let dbPath = path.join(process.cwd(), 'database.sqlite');
if (!fs.existsSync(dbPath)) {
  dbPath = path.join(process.cwd(), 'apps', 'api', 'database.sqlite');
}
if (!fs.existsSync(dbPath)) {
  console.error('Arquivo database.sqlite não encontrado');
  process.exit(1);
}

console.log('Usando banco de dados:', dbPath);
console.log('\n⚠️  ATENÇÃO: Este script irá DELETAR todos os registros das tabelas:');
console.log('   - proposals');
console.log('   - invoices');
console.log('   - invoice_taxes');
console.log('\nPressione Ctrl+C para cancelar ou aguarde 5 segundos para continuar...\n');

setTimeout(() => {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erro ao conectar:', err.message);
      process.exit(1);
    }
    console.log('Conectado ao banco de dados');
  });

  // Deletar registros (manter estrutura das tabelas)
  db.serialize(() => {
    db.run('DELETE FROM invoice_taxes', (err) => {
      if (err) {
        console.error('Erro ao deletar invoice_taxes:', err.message);
      } else {
        console.log('✅ Tabela invoice_taxes limpa');
      }
    });

    db.run('DELETE FROM invoices', (err) => {
      if (err) {
        console.error('Erro ao deletar invoices:', err.message);
      } else {
        console.log('✅ Tabela invoices limpa');
      }
    });

    db.run('DELETE FROM proposals', (err) => {
      if (err) {
        console.error('Erro ao deletar proposals:', err.message);
      } else {
        console.log('✅ Tabela proposals limpa');
      }
    });

    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar banco:', err.message);
      } else {
        console.log('\n✅ Limpeza concluída!');
        console.log('Agora você pode executar as migrations e criar novos registros.');
      }
    });
  });
}, 5000);


