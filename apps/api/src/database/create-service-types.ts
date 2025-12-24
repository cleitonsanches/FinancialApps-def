import { DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';

async function createServiceTypes() {
  // O banco está em apps/api/database.sqlite
  // Quando executado via ts-node, process.cwd() pode estar na raiz do projeto
  const possiblePaths = [
    join(process.cwd(), 'apps', 'api', 'database.sqlite'),
    join(process.cwd(), 'database.sqlite'),
    join(__dirname, '..', '..', 'database.sqlite'),
  ];
  
  let databasePath = possiblePaths[0];
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      databasePath = path;
      break;
    }
  }
  
  console.log('Caminho do banco de dados:', databasePath);
  
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [],
    synchronize: false,
    logging: true,
  });

  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('Banco de dados conectado com sucesso!');
    
    const queryRunner = dataSource.createQueryRunner();
    
    // Verificar se a tabela já existe
    const table = await queryRunner.getTable('service_types');
    
    if (!table) {
      console.log('Criando tabela service_types...');
      await queryRunner.query(`
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
      `);
      console.log('✅ Tabela service_types criada com sucesso!');
    } else {
      console.log('✅ Tabela service_types já existe.');
    }
    
    // Verificar se já existem registros
    const countResult = await queryRunner.query('SELECT COUNT(*) as count FROM service_types');
    const count = countResult[0]?.count || 0;
    
    if (count === 0) {
      console.log('Populando tabela com tipos de serviços iniciais...');
      
      // Buscar todas as empresas para criar tipos de serviços para cada uma
      const companies = await queryRunner.query('SELECT id FROM companies');
      
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
      
      for (const company of companies) {
        for (const serviceType of serviceTypes) {
          // Verificar se já existe
          const exists = await queryRunner.query(
            'SELECT id FROM service_types WHERE code = ? AND company_id = ?',
            [serviceType.code, company.id]
          );
          
          if (exists.length === 0) {
            const id = crypto.randomUUID();
            await queryRunner.query(
              `INSERT INTO service_types (id, company_id, code, name, active, created_at, updated_at) 
               VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [id, company.id, serviceType.code, serviceType.name]
            );
            console.log(`✅ Tipo de serviço ${serviceType.name} criado para empresa ${company.id}`);
          }
        }
      }
      
      console.log('✅ Tipos de serviços iniciais criados com sucesso!');
    } else {
      console.log(`✅ Tabela já possui ${count} tipos de serviços.`);
    }
    
    await queryRunner.release();
    await dataSource.destroy();
    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao criar tipos de serviços:', error.message);
    console.error('Detalhes:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createServiceTypes();
}

export default createServiceTypes;

