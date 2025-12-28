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

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar:', err.message);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados');
});

const columns = [
  { name: 'tipo_emissao', type: 'VARCHAR(10) DEFAULT NULL' }, // 'NF' ou 'EF'
  { name: 'desconto', type: 'DECIMAL(15,2) DEFAULT 0' },
  { name: 'acrescimo', type: 'DECIMAL(15,2) DEFAULT 0' },
  { name: 'conta_corrente_id', type: 'VARCHAR(36) DEFAULT NULL' },
];

let completed = 0;
const total = columns.length;

columns.forEach((col) => {
  db.run(`ALTER TABLE invoices ADD COLUMN ${col.name} ${col.type}`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error(`Erro ao adicionar ${col.name}:`, err.message);
    } else {
      console.log(`✅ Coluna ${col.name} adicionada ou já existe`);
    }
    
    completed++;
    if (completed === total) {
      // Criar índice para conta_corrente_id
      db.run('CREATE INDEX IF NOT EXISTS IX_invoices_conta_corrente_id ON invoices(conta_corrente_id)', (err2) => {
        if (err2) {
          console.error('Erro ao criar índice:', err2.message);
        } else {
          console.log('✅ Índice IX_invoices_conta_corrente_id criado ou já existe');
        }
        
        db.close((err3) => {
          if (err3) {
            console.error('Erro ao fechar banco:', err3.message);
          } else {
            console.log('\n✅ Migração concluída!');
          }
        });
      });
    }
  });
});


