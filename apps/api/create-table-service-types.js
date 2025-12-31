const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

// Caminho do banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔍 Procurando banco de dados em:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('❌ Banco de dados não encontrado em:', dbPath);
  process.exit(1);
}

console.log('✅ Banco de dados encontrado!');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco de dados');
});

// Verificar se a tabela já existe
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='service_types'", (err, row) => {
  if (err) {
    console.error('❌ Erro ao verificar tabela:', err.message);
    db.close();
    process.exit(1);
  }

  if (row) {
    console.log('✅ Tabela service_types já existe');
    db.close();
    return;
  }

  // Criar a tabela
  console.log('📝 Criando tabela service_types...');
  db.run(`
    CREATE TABLE service_types (
      id VARCHAR(36) PRIMARY KEY,
      company_id VARCHAR(36) NOT NULL,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, code)
    )
  `, function(err) {
    if (err) {
      console.error('❌ Erro ao criar tabela:', err.message);
      db.close();
      process.exit(1);
    }
    console.log('✅ Tabela service_types criada com sucesso!');

    // Buscar empresas e popular tipos iniciais
    db.all('SELECT id FROM companies', [], (err, companies) => {
      if (err) {
        console.error('❌ Erro ao buscar empresas:', err.message);
        db.close();
        process.exit(1);
      }

      if (!companies || companies.length === 0) {
        console.log('⚠️  Nenhuma empresa encontrada. Tabela criada, mas não foi populada.');
        console.log('✅ Você pode criar tipos de serviços manualmente agora.');
        db.close();
        return;
      }

      console.log(`📊 Encontradas ${companies.length} empresa(s). Populando tipos iniciais...`);

      const serviceTypes = [
        { code: 'AUTOMACOES', name: 'Automações' },
        { code: 'CONSULTORIA', name: 'Consultoria' },
        { code: 'TREINAMENTO', name: 'Treinamento' },
        { code: 'MIGRACAO_DADOS', name: 'Migração de Dados' },
        { code: 'ANALISE_DADOS', name: 'Análise de Dados' },
        { code: 'ASSINATURAS', name: 'Assinaturas' },
        { code: 'MANUTENCOES', name: 'Manutenções' },
        { code: 'DESENVOLVIMENTOS', name: 'Desenvolvimentos' },
      ];

      let completed = 0;
      let total = companies.length * serviceTypes.length;
      let errors = 0;

      companies.forEach((company) => {
        serviceTypes.forEach((serviceType) => {
          // Verificar se já existe
          db.get(
            'SELECT id FROM service_types WHERE code = ? AND company_id = ?',
            [serviceType.code, company.id],
            (err, row) => {
              if (err) {
                console.error(`❌ Erro ao verificar ${serviceType.name}:`, err.message);
                errors++;
                completed++;
                if (completed === total) {
                  console.log(`\n✅ Processo concluído! ${total - errors} tipos criados, ${errors} erros.`);
                  db.close();
                }
                return;
              }

              if (row) {
                completed++;
                if (completed === total) {
                  console.log(`\n✅ Processo concluído!`);
                  db.close();
                }
                return;
              }

              // Inserir
              const id = randomUUID();
              db.run(
                `INSERT INTO service_types (id, company_id, code, name, active, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [id, company.id, serviceType.code, serviceType.name],
                function(err) {
                  if (err) {
                    console.error(`❌ Erro ao inserir ${serviceType.name}:`, err.message);
                    errors++;
                  } else {
                    console.log(`  ✅ ${serviceType.name} criado`);
                  }
                  completed++;
                  if (completed === total) {
                    console.log(`\n✅ Processo concluído! ${total - errors} tipos criados, ${errors} erros.`);
                    db.close();
                  }
                }
              );
            }
          );
        });
      });
    });
  });
});



