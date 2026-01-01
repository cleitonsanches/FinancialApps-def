import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';

async function importCsvToSQLServer() {
  console.log('🚀 Iniciando importação de dados CSV para SQL Server (Azure)...\n');

  // Carregar variáveis de ambiente
  const projectRoot = join(__dirname, '../../../../');
  const envLocalPath = join(projectRoot, '.env.local');
  dotenv.config({ path: envLocalPath });
  
  if (!process.env.DB_TYPE) {
    dotenv.config({ path: join(projectRoot, '.env') });
  }

  // Validar configurações
  if (process.env.DB_TYPE !== 'mssql') {
    console.error('❌ Este script é apenas para SQL Server (mssql)!');
    process.exit(1);
  }

  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente faltando:', missingVars.join(', '));
    process.exit(1);
  }

  // Caminho da pasta de exportação
  const exportDir = join(projectRoot, 'export-sqlserver');
  
  if (!fs.existsSync(exportDir)) {
    console.error(`❌ Pasta de exportação não encontrada: ${exportDir}`);
    console.error('💡 Execute primeiro o script de exportação na VPS');
    process.exit(1);
  }

  console.log('📁 Pasta de exportação:', exportDir);
  console.log('📋 Configuração do banco:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_DATABASE}`);
  console.log('');

  // Ordem de importação (respeitando foreign keys)
  // IMPORTANTE: Esta ordem respeita as dependências de foreign keys
  // Mapeamento: nome_arquivo_csv => nome_tabela_sql_server
  const importOrder = [
    // Tabelas base (sem dependências)
    { csv: 'companies', table: 'companies' },
    // Dependem de companies
    { csv: 'clients', table: 'clients' }, // Depende de companies
    { csv: 'contacts', table: 'contacts' }, // Depende de companies (e pode ter client_id, mas é nullable)
    { csv: 'users', table: 'users' }, // Depende de companies e contacts (nullable)
    { csv: 'service_types', table: 'service_types' }, // Depende de companies
    { csv: 'chart_of_accounts', table: 'chart_of_accounts' }, // Depende de companies
    { csv: 'bank_accounts', table: 'bank_accounts' }, // Depende de companies
    // Tabelas independentes ou dependem apenas de companies
    { csv: 'subscription_products', table: 'subscription_products' },
    { csv: 'proposal_templates', table: 'proposal_templates' }, // Depende de companies
    { csv: 'project_templates', table: 'project_templates' }, // Depende de companies
    { csv: 'project_template_phases', table: 'project_template_phases' }, // Depende de project_templates
    { csv: 'project_template_tasks', table: 'project_template_tasks' }, // Depende de project_template_phases
    // Dependem de clients, users, companies
    { csv: 'proposals', table: 'proposals' }, // Depende de companies, clients, users
    { csv: 'proposal_aditivos', table: 'proposal_aditivos' }, // Depende de proposals
    { csv: 'projects', table: 'projects' }, // Depende de proposals, clients, project_templates
    { csv: 'phases', table: 'phases' }, // Depende de projects
    { csv: 'project_tasks', table: 'project_tasks' }, // Depende de projects, phases, users
    // Dependem de proposals, clients, companies, chart_of_accounts
    { csv: 'invoices', table: 'invoices' }, // Depende de proposals, clients, companies, chart_of_accounts
    { csv: 'invoice_taxes', table: 'invoice_taxes' }, // Depende de invoices
    { csv: 'invoice_history', table: 'invoice_history' }, // Depende de invoices
    // Dependem de companies
    { csv: 'accounts_payable', table: 'accounts_payable' }, // Depende de companies
    { csv: 'invoice_account_payable', table: 'invoice_account_payable' }, // Depende de invoices e accounts_payable
    { csv: 'reimbursements', table: 'reimbursements' }, // Depende de companies, users, accounts_payable, invoices
    // Depende de projects, tasks, users, proposals, clients
    { csv: 'time_entries', table: 'time_entries' }, // Depende de projects, tasks, users, proposals, clients
  ];

  // Criar DataSource
  const dataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '1433'),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    entities: [], // Não precisamos das entidades para importação
    synchronize: false,
    logging: false,
    extra: {
      encrypt: true,
      trustServerCertificate: false,
    },
  });

  try {
    console.log('🔌 Conectando ao SQL Server...');
    await dataSource.initialize();
    console.log('✅ Conectado ao SQL Server!\n');

    const queryRunner = dataSource.createQueryRunner();
    
    let totalImported = 0;
    let totalErrors = 0;

    // Função para identificar se uma coluna é UUID baseado no nome
    function isUUIDColumn(columnName: string): boolean {
      const uuidPattern = /_id$/i; // Colunas que terminam com _id geralmente são UUIDs
      const isIdColumn = columnName.toLowerCase() === 'id' || uuidPattern.test(columnName);
      return isIdColumn;
    }

    // Função para identificar se uma coluna é data baseado no nome
    function isDateColumn(columnName: string): boolean {
      const datePatterns = [
        /date/i,
        /data/i,
        /created_at/i,
        /updated_at/i,
        /_at$/i,
      ];
      return datePatterns.some(pattern => pattern.test(columnName));
    }

    // Função para identificar se uma coluna é numérica baseado no nome (mas não UUID ou data)
    function isNumericColumn(columnName: string): boolean {
      if (isUUIDColumn(columnName) || isDateColumn(columnName)) {
        return false; // UUIDs e datas não são numéricos para conversão
      }
      const numericPatterns = [
        /valor/i,
        /value/i,
        /preco/i,
        /price/i,
        /amount/i,
        /quantidade/i,
        /quantity/i,
        /numero/i,
        /number/i,
        /percentual/i,
        /percent/i,
        /saldo/i,  // saldo_inicial, saldo, etc.
        /decimal/i,
        /total/i,
      ];
      return numericPatterns.some(pattern => pattern.test(columnName));
    }

    // Função para identificar se uma coluna é booleana baseado no nome
    function isBooleanColumn(columnName: string): boolean {
      const booleanPatterns = [
        /^is_/i,
        /^has_/i,
        /^active$/i,
        /^enabled$/i,
        /^disabled$/i,
      ];
      return booleanPatterns.some(pattern => pattern.test(columnName));
    }

    // Função para converter valor CSV para tipo correto
    function convertValue(value: string, columnName: string): any {
      const trimmed = value ? value.trim() : '';
      
      // Se for coluna de data obrigatória (created_at, updated_at) e estiver vazia, usar data atual
      const isRequiredDateColumn = (columnName.toLowerCase() === 'created_at' || columnName.toLowerCase() === 'updated_at');
      if (isDateColumn(columnName) && isRequiredDateColumn) {
        if (trimmed === '' || value === null || value === undefined) {
          const now = new Date();
          return now.toISOString().replace('T', ' ').substring(0, 19);
        }
      }
      
      if (trimmed === '' || value === null || value === undefined) {
        // Se for coluna de data obrigatória, garantir que não retorne null
        if (isRequiredDateColumn) {
          const now = new Date();
          return now.toISOString().replace('T', ' ').substring(0, 19);
        }
        return null;
      }

      // UUIDs: verificar primeiro antes de outras conversões
      if (isUUIDColumn(columnName)) {
        // Se parece ser UUID válido, manter como string
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
          return trimmed; // Retornar string para UUID
        }
        // Se for vazio, null, ou string vazia em coluna UUID, retornar null
        if (trimmed === '' || trimmed === 'null' || trimmed === 'NULL') {
          return null;
        }
        // Se não for UUID válido mas tem conteúdo, manter como está (pode causar erro, mas melhor que silenciar)
        return trimmed;
      }

      // Datas
      if (isDateColumn(columnName)) {
        // Se parece ser data/datetime no formato SQLite (YYYY-MM-DD HH:MM:SS ou YYYY-MM-DD)
        const dateTimePattern = /^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}:\d{2})?/;
        if (dateTimePattern.test(trimmed)) {
          return trimmed; // Manter como string, SQL Server converte
        }
        // Se for apenas números, pode ser timestamp Unix
        if (/^\d+$/.test(trimmed)) {
          const timestamp = parseInt(trimmed, 10);
          if (timestamp > 1000000000 && timestamp < 9999999999) { // Timestamp Unix válido
            const date = new Date(timestamp * 1000);
            return date.toISOString().replace('T', ' ').substring(0, 19);
          }
        }
        // Se for coluna de data obrigatória (created_at, updated_at), SEMPRE usar data atual se não for válida
        if (isRequiredDateColumn) {
          const now = new Date();
          return now.toISOString().replace('T', ' ').substring(0, 19);
        }
        // Para colunas de data não obrigatórias, retornar null se não for válida
        return null;
      }

      // Booleanos
      if (isBooleanColumn(columnName)) {
        if (trimmed === '0' || trimmed === '1' || trimmed === 'false' || trimmed === 'true' || trimmed === 'False' || trimmed === 'True') {
          return trimmed === '1' || trimmed === 'true' || trimmed === 'True';
        }
        // Se for número, converter
        const num = parseInt(trimmed, 10);
        if (!isNaN(num)) {
          return num !== 0;
        }
        return trimmed === 'true' || trimmed === 'True';
      }

      // Numéricos - só converter se for realmente um número puro (sem letras)
      if (isNumericColumn(columnName)) {
        // Verificar se é um número válido (inclui decimais)
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          if (trimmed.includes('.')) {
            return parseFloat(trimmed);
          }
          return parseInt(trimmed, 10);
        }
        // Se não for número válido, manter como string
        return trimmed;
      }

      // Para outras colunas, manter como string
      return trimmed;
    }

    // Função para importar tabela
    async function importTable(csvName: string, tableName: string): Promise<{ imported: number; errors: number }> {
      const csvPath = join(exportDir, `${csvName}.csv`);
      
      if (!fs.existsSync(csvPath)) {
        console.log(`   ⚠️  Arquivo não encontrado: ${csvName}.csv (ignorando...)`);
        return { imported: 0, errors: 0 };
      }

      const fileContent = fs.readFileSync(csvPath, 'utf-8');
      
      if (!fileContent || fileContent.trim().length === 0) {
        console.log(`   ⚠️  Arquivo vazio: ${csvName}.csv (ignorando...)`);
        return { imported: 0, errors: 0 };
      }

        try {
        // Parse CSV e filtrar linhas que são cabeçalhos duplicados
        const allRecords = csv.parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }) as Record<string, string>[];
        
        // Filtrar registros que parecem ser cabeçalhos (todos os valores são nomes de colunas válidos)
        const records = allRecords.filter(record => {
          const values = Object.values(record);
          // Se todos os valores parecem ser nomes de colunas (sem UUIDs, sem datas), ignorar
          const hasValidData = values.some(val => {
            if (!val || val.trim() === '') return false;
            // Se tem UUID, data, ou número, é provavelmente um registro válido
            return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()) ||
                   /^\d{4}-\d{2}-\d{2}/.test(val.trim()) ||
                   /^\d+$/.test(val.trim());
          });
          return hasValidData;
        });

        if (records.length === 0) {
          console.log(`   ⚠️  Nenhum registro encontrado em ${csvName}.csv`);
          return { imported: 0, errors: 0 };
        }

        console.log(`📤 Importando ${tableName}... (${records.length} registros)`);

        let imported = 0;
        let errors = 0;

        // Construir query INSERT com valores diretamente (escapando adequadamente)
        const columns = Object.keys(records[0]);
        const columnNames = columns.map(col => `[${col}]`).join(', ');

        // Função para escapar valores para SQL Server
        function escapeValue(value: any, columnName: string): string {
          if (value === null || value === undefined) {
            return 'NULL';
          }

          // Tipos primitivos
          if (typeof value === 'boolean') {
            return value ? '1' : '0';
          }
          if (typeof value === 'number') {
            return value.toString();
          }
          if (typeof value === 'string') {
            // Para UUIDs (colunas terminando em _id ou chamadas 'id'), usar formato direto
            if (isUUIDColumn(columnName) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
              return `'${value}'`; // UUID já está no formato correto
            }
            // Para datas, manter formato
            if (isDateColumn(columnName)) {
              return `'${value}'`;
            }
            // Para strings normais, escapar aspas simples dobrando-as
            const escaped = value.replace(/'/g, "''");
            return `'${escaped}'`;
          }
          
          // Para outros tipos, converter para string
          return `'${String(value).replace(/'/g, "''")}'`;
        }

        for (const record of records) {
          try {
            const values = columns.map((col) => {
              const value = record[col];
              const converted = convertValue(value, col);
              return escapeValue(converted, col);
            });
            
            const valuesStr = values.join(', ');
            const insertQuery = `INSERT INTO [${tableName}] (${columnNames}) VALUES (${valuesStr})`;
            
            await queryRunner.query(insertQuery);
            imported++;
          } catch (error: any) {
            errors++;
            if (errors <= 3) { // Mostrar apenas os 3 primeiros erros
              console.log(`      ❌ Erro ao importar registro: ${error.message}`);
            }
          }
        }

        if (imported > 0) {
          console.log(`   ✅ Importados: ${imported} registros`);
        }
        if (errors > 0) {
          console.log(`   ⚠️  Erros: ${errors} registros`);
        }

        return { imported, errors };
      } catch (error: any) {
        console.log(`   ❌ Erro ao processar arquivo: ${error.message}`);
        return { imported: 0, errors: 1 };
      }
    }

    // Importar tabelas na ordem correta
    console.log('📊 Iniciando importação de dados...\n');

    for (const { csv: csvName, table: tableName } of importOrder) {
      const result = await importTable(csvName, tableName);
      totalImported += result.imported;
      totalErrors += result.errors;
    }

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n========================================');
    console.log('📊 Resumo da Importação');
    console.log('========================================');
    console.log(`✅ Total importado: ${totalImported} registros`);
    if (totalErrors > 0) {
      console.log(`⚠️  Total de erros: ${totalErrors} registros`);
    }
    console.log('✅ Importação concluída!');
  } catch (error: any) {
    console.error('\n❌ Erro durante importação:', error.message);
    if (error.message?.includes('connect')) {
      console.error('\n💡 Dicas:');
      console.error('   - Verifique se o firewall do Azure permite conexões do seu IP');
      console.error('   - Confirme se as credenciais no .env.local estão corretas');
    }
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  importCsvToSQLServer()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro fatal:', error);
      process.exit(1);
    });
}

export default importCsvToSQLServer;

