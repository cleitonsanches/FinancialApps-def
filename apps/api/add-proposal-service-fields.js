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
  // Análise de Dados
  { name: 'data_inicio_analise', type: 'DATE' },
  { name: 'data_programada_homologacao', type: 'DATE' },
  { name: 'data_programada_producao', type: 'DATE' },
  
  // Assinaturas
  { name: 'tipo_produto_assinado', type: 'VARCHAR(100)' },
  { name: 'quantidade_usuarios', type: 'INTEGER' },
  { name: 'valor_unitario_usuario', type: 'DECIMAL(15,2)' },
  { name: 'data_inicio_assinatura', type: 'DATE' },
  { name: 'vencimento_assinatura', type: 'DATE' },
  
  // Manutenções
  { name: 'descricao_manutencao', type: 'TEXT' },
  { name: 'valor_mensal_manutencao', type: 'DECIMAL(15,2)' },
  { name: 'data_inicio_manutencao', type: 'DATE' },
  { name: 'vencimento_manutencao', type: 'DATE' },
  
  // Contrato Fixo
  { name: 'valor_mensal_fixo', type: 'DECIMAL(15,2)' },
  { name: 'data_fim_contrato', type: 'DATE' },
  
  // Campos genéricos
  { name: 'tem_manutencao_vinculada', type: 'BOOLEAN DEFAULT 0' },
  { name: 'proposta_manutencao_id', type: 'VARCHAR(36)' },
];

let completed = 0;
const total = columns.length;

columns.forEach((col, index) => {
  db.run(`ALTER TABLE proposals ADD COLUMN ${col.name} ${col.type}`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error(`Erro ao adicionar ${col.name}:`, err.message);
    } else {
      console.log(`✅ Coluna ${col.name} adicionada ou já existe`);
    }
    
    completed++;
    if (completed === total) {
      db.close((err2) => {
        if (err2) {
          console.error('Erro ao fechar banco:', err2.message);
        } else {
          console.log('\n✅ Migração concluída!');
        }
      });
    }
  });
});

