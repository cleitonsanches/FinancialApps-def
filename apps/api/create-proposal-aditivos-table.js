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

// Criar tabela proposal_aditivos
const createTableSQL = `
CREATE TABLE IF NOT EXISTS proposal_aditivos (
  id VARCHAR(36) PRIMARY KEY,
  proposal_id VARCHAR(36) NOT NULL,
  data_aditivo DATE NOT NULL,
  percentual_reajuste DECIMAL(5,2) NOT NULL,
  valor_anterior DECIMAL(15,2) NOT NULL,
  valor_novo DECIMAL(15,2) NOT NULL,
  ano_referencia INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS IX_proposal_aditivos_proposal_id ON proposal_aditivos(proposal_id);
`;

db.exec(createTableSQL, (err) => {
  if (err) {
    console.error('Erro ao criar tabela proposal_aditivos:', err.message);
  } else {
    console.log('✅ Tabela proposal_aditivos criada ou já existe');
    console.log('✅ Índice IX_proposal_aditivos_proposal_id criado ou já existe');
  }
  
  db.close((err2) => {
    if (err2) {
      console.error('Erro ao fechar banco:', err2.message);
    } else {
      console.log('\n✅ Migração concluída!');
    }
  });
});





