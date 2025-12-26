const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Encontrar o arquivo database.sqlite
function findDatabase() {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'api', 'database.sqlite'),
    path.join(process.cwd(), 'database.sqlite'),
    path.join(__dirname, 'database.sqlite'),
    path.join(__dirname, '..', 'database.sqlite'),
  ];

  for (const dbPath of possiblePaths) {
    if (fs.existsSync(dbPath)) {
      return dbPath;
    }
  }

  throw new Error('Arquivo database.sqlite não encontrado');
}

const dbPath = findDatabase();
console.log('Usando banco de dados:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err);
    process.exit(1);
  }
  console.log('Conectado ao banco de dados SQLite');
});

// Função para verificar se uma coluna existe
function columnExists(tableName, columnName) {
  return new Promise((resolve, reject) => {
    db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const exists = rows.some(row => row.name === columnName);
      resolve(exists);
    });
  });
}

// Função para adicionar coluna se não existir
async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
  const exists = await columnExists(tableName, columnName);
  if (!exists) {
    return new Promise((resolve, reject) => {
      db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`, (err) => {
        if (err) {
          console.error(`Erro ao adicionar coluna ${columnName}:`, err);
          reject(err);
        } else {
          console.log(`✓ Coluna ${columnName} adicionada com sucesso`);
          resolve();
        }
      });
    });
  } else {
    console.log(`- Coluna ${columnName} já existe`);
    return Promise.resolve();
  }
}

async function main() {
  try {
    console.log('\n=== Adicionando campos de tipo na tabela project_tasks ===\n');

    // Adicionar coluna tipo (ATIVIDADE ou EVENTO)
    await addColumnIfNotExists('project_tasks', 'tipo', "VARCHAR(20) DEFAULT 'ATIVIDADE'");
    
    // Adicionar coluna hora_inicio (para eventos)
    await addColumnIfNotExists('project_tasks', 'hora_inicio', 'VARCHAR(10) NULL');
    
    // Adicionar coluna hora_fim (para eventos)
    await addColumnIfNotExists('project_tasks', 'hora_fim', 'VARCHAR(10) NULL');
    
    // Adicionar coluna sem_prazo_definido (para atividades)
    await addColumnIfNotExists('project_tasks', 'sem_prazo_definido', 'BOOLEAN DEFAULT 0');
    
    // Adicionar coluna dia_inteiro (para eventos)
    await addColumnIfNotExists('project_tasks', 'dia_inteiro', 'BOOLEAN DEFAULT 0');

    console.log('\n=== Migração concluída com sucesso! ===\n');
    
    db.close((err) => {
      if (err) {
        console.error('Erro ao fechar banco:', err);
        process.exit(1);
      }
      console.log('Conexão com banco de dados fechada');
      process.exit(0);
    });
  } catch (error) {
    console.error('Erro durante migração:', error);
    db.close();
    process.exit(1);
  }
}

main();

