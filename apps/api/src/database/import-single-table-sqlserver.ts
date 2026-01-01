import { DataSource } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as csv from 'csv-parse/sync';

async function importSingleTable(tableCsvName: string, tableDbName?: string, useMerge: boolean = false) {
  const tableName = tableDbName || tableCsvName;

  console.log(`🚀 Importando tabela: ${tableName}...`);
  if (useMerge) {
    console.log('📝 Modo: MERGE (atualizar existentes, inserir novos)\n');
  } else {
    console.log('📝 Modo: INSERT (apenas inserir novos)\n');
  }

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
  const csvPath = join(exportDir, `${tableCsvName}.csv`);
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Arquivo CSV não encontrado: ${csvPath}`);
    process.exit(1);
  }

  console.log('📁 Arquivo CSV:', csvPath);
  console.log('📋 Configuração do banco:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_DATABASE}`);
  console.log(`   Tabela: ${tableName}`);
  console.log('');

  // Criar DataSource
  const dataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '1433'),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    entities: [],
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
    
    // Funções auxiliares (mesmas do script completo)
    function isUUIDColumn(columnName: string): boolean {
      const uuidPattern = /_id$/i;
      const isIdColumn = columnName.toLowerCase() === 'id' || uuidPattern.test(columnName);
      return isIdColumn;
    }

    function isDateColumn(columnName: string): boolean {
      const datePatterns = [/date/i, /data/i, /created_at/i, /updated_at/i, /_at$/i];
      return datePatterns.some(pattern => pattern.test(columnName));
    }

    function isNumericColumn(columnName: string): boolean {
      if (isUUIDColumn(columnName) || isDateColumn(columnName)) {
        return false;
      }
      const numericPatterns = [/valor/i, /value/i, /preco/i, /price/i, /amount/i, /quantidade/i, /quantity/i, /numero/i, /number/i, /percentual/i, /percent/i, /saldo/i, /decimal/i, /total/i];
      return numericPatterns.some(pattern => pattern.test(columnName));
    }

    function isBooleanColumn(columnName: string): boolean {
      const booleanPatterns = [/^is_/i, /^has_/i, /^active$/i, /^enabled$/i, /^disabled$/i];
      return booleanPatterns.some(pattern => pattern.test(columnName));
    }

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

      if (isUUIDColumn(columnName)) {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
          return trimmed;
        }
        if (trimmed === '' || trimmed === 'null' || trimmed === 'NULL') {
          return null;
        }
        return trimmed;
      }

      if (isDateColumn(columnName)) {
        const dateTimePattern = /^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}:\d{2})?/;
        if (dateTimePattern.test(trimmed)) {
          return trimmed;
        }
        if (/^\d+$/.test(trimmed)) {
          const timestamp = parseInt(trimmed, 10);
          if (timestamp > 1000000000 && timestamp < 9999999999) {
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

      if (isBooleanColumn(columnName)) {
        if (trimmed === '0' || trimmed === '1' || trimmed === 'false' || trimmed === 'true' || trimmed === 'False' || trimmed === 'True') {
          return trimmed === '1' || trimmed === 'true' || trimmed === 'True';
        }
        const num = parseInt(trimmed, 10);
        if (!isNaN(num)) {
          return num !== 0;
        }
        return trimmed === 'true' || trimmed === 'True';
      }

      if (isNumericColumn(columnName)) {
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          if (trimmed.includes('.')) {
            return parseFloat(trimmed);
          }
          return parseInt(trimmed, 10);
        }
        return trimmed;
      }

      return trimmed;
    }

    function escapeValue(value: any, columnName: string): string {
      if (value === null || value === undefined) {
        return 'NULL';
      }

      if (typeof value === 'boolean') {
        return value ? '1' : '0';
      }
      if (typeof value === 'number') {
        return value.toString();
      }
      if (typeof value === 'string') {
        if (isUUIDColumn(columnName) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
          return `'${value}'`;
        }
        if (isDateColumn(columnName)) {
          return `'${value}'`;
        }
        const escaped = value.replace(/'/g, "''");
        return `'${escaped}'`;
      }
      
      return `'${String(value).replace(/'/g, "''")}'`;
    }

    // Ler e processar CSV
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    
    if (!fileContent || fileContent.trim().length === 0) {
      console.log('⚠️  Arquivo vazio!');
      await dataSource.destroy();
      process.exit(0);
    }

    // Parse CSV manualmente para garantir que apenas a primeira linha seja usada como cabeçalho
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      console.log('⚠️  Arquivo vazio ou sem dados!');
      await dataSource.destroy();
      process.exit(0);
    }
    
    // Função para fazer parse de uma linha CSV considerando aspas
    function parseCSVLine(line: string): string[] {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result.map(val => val.replace(/^"|"$/g, ''));
    }
    
    // Primeira linha é o cabeçalho
    const headerColumns = parseCSVLine(lines[0]);
    
    // Parse linhas de dados (começando da linha 2, ignorando possíveis cabeçalhos duplicados)
    const records: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      // Se a primeira coluna não for um UUID válido, provavelmente é um cabeçalho duplicado - pular
      if (values[0] && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(values[0])) {
        continue;
      }
      
      // Criar registro mapeando valores para as colunas do cabeçalho
      const record: Record<string, string> = {};
      headerColumns.forEach((col, index) => {
        record[col] = values[index] || '';
      });
      
      // Verificar se tem dados válidos (pelo menos um UUID ou data)
      const hasValidData = Object.values(record).some(val => {
        if (!val || val.trim() === '') return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim()) ||
               /^\d{4}-\d{2}-\d{2}/.test(val.trim());
      });
      
      if (hasValidData) {
        records.push(record);
      }
    }

    if (records.length === 0) {
      console.log('⚠️  Nenhum registro válido encontrado!');
      await dataSource.destroy();
      process.exit(0);
    }

    console.log(`📤 Importando ${tableName}... (${records.length} registros)\n`);

    const columns = Object.keys(records[0]);
    const columnNames = columns.map(col => `[${col}]`).join(', ');

    // Identificar coluna de chave primária (geralmente 'id')
    const primaryKeyColumn = columns.find(col => col.toLowerCase() === 'id') || columns[0];

    let imported = 0;
    let errors = 0;

    for (const record of records) {
      try {
        const values = columns.map((col) => {
          const value = record[col];
          const converted = convertValue(value, col);
          return escapeValue(converted, col);
        });
        
        const valuesStr = values.join(', ');
        
        let query: string;
        
        if (useMerge) {
          // Usar MERGE (UPSERT) - atualizar se existir, inserir se não existir
          const primaryKeyIndex = columns.indexOf(primaryKeyColumn);
          const primaryKeyValue = values[primaryKeyIndex];
          
          // Construir lista de colunas para UPDATE (todas exceto a chave primária)
          const updateColumns = columns.filter(col => col !== primaryKeyColumn);
          const updateSet = updateColumns.map(col => {
            const colIndex = columns.indexOf(col);
            return `target.[${col}] = source.[${col}]`;
          }).join(', ');
          
          // Construir valores para INSERT usando source
          const sourceColumns = columns.map(col => {
            const colIndex = columns.indexOf(col);
            return `${values[colIndex]} AS [${col}]`;
          }).join(', ');
          
          query = `
            MERGE [${tableName}] AS target
            USING (SELECT ${sourceColumns}) AS source (${columnNames})
            ON target.[${primaryKeyColumn}] = source.[${primaryKeyColumn}]
            WHEN MATCHED THEN
              UPDATE SET ${updateSet}
            WHEN NOT MATCHED THEN
              INSERT (${columnNames}) VALUES (${columnNames.split(',').map(() => 'source.[' + columns.map(c => c + ']').join(', source.[') + ']').join(', ')});
          `;
          
          // Versão simplificada e mais segura do MERGE
          query = `
            MERGE [${tableName}] AS target
            USING (SELECT ${sourceColumns}) AS source (${columnNames})
            ON target.[${primaryKeyColumn}] = source.[${primaryKeyColumn}]
            WHEN MATCHED THEN
              UPDATE SET ${updateSet}
            WHEN NOT MATCHED THEN
              INSERT (${columnNames}) VALUES (${columns.map(col => `source.[${col}]`).join(', ')});
          `;
        } else {
          // Usar INSERT simples
          query = `INSERT INTO [${tableName}] (${columnNames}) VALUES (${valuesStr})`;
        }
        
        await queryRunner.query(query);
        imported++;
      } catch (error: any) {
        errors++;
        if (errors <= 5) {
          console.log(`   ❌ Erro: ${error.message}`);
        }
      }
    }

    await queryRunner.release();
    await dataSource.destroy();

    console.log('\n========================================');
    console.log('📊 Resumo da Importação');
    console.log('========================================');
    console.log(`✅ Importados: ${imported} registros`);
    if (errors > 0) {
      console.log(`⚠️  Erros: ${errors} registros`);
    }
    console.log('✅ Importação concluída!');
  } catch (error: any) {
    console.error('\n❌ Erro durante importação:', error.message);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

// Executar
const tableName = process.argv[2];
const tableDbName = process.argv[3]; // Opcional: nome diferente no banco
const useMerge = process.argv.includes('--merge') || process.argv.includes('-m'); // Opção para usar MERGE

if (!tableName) {
  console.error('❌ Uso: npm run import:table:sqlserver <nome-csv> [nome-banco] [--merge]');
  console.error('   Exemplo: npm run import:table:sqlserver companies');
  console.error('   Exemplo: npm run import:table:sqlserver invoice_taxes invoice_taxes');
  console.error('   Exemplo: npm run import:table:sqlserver proposal_templates --merge');
  console.error('');
  console.error('   --merge ou -m: Usa MERGE (atualiza existentes, insere novos)');
  process.exit(1);
}

importSingleTable(tableName, tableDbName, useMerge)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

