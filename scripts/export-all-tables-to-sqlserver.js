// Script completo para exportar TODAS as tabelas do SQLite para migração ao SQL Server
// Execute: node scripts/export-all-tables-to-sqlserver.js

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando exportação COMPLETA de dados para SQL Server...\n');

// Caminhos - tentar múltiplos locais possíveis (priorizar apps/api)
const projectRoot = path.join(__dirname, '..');
const possibleDbPaths = [
    path.join(projectRoot, 'apps', 'api', 'database.sqlite'),  // apps/api (prioritário)
    path.join(projectRoot, 'database.sqlite'),           // Raiz do projeto
];

let dbPath = null;
for (const possiblePath of possibleDbPaths) {
    if (fs.existsSync(possiblePath)) {
        dbPath = possiblePath;
        break;
    }
}

const exportDir = path.join(projectRoot, 'export-sqlserver');

// Verificar se o banco existe
if (!dbPath) {
    console.error('❌ Banco de dados não encontrado!');
    console.error('⚠️  Procurei em:');
    possibleDbPaths.forEach(p => console.error(`   - ${p}`));
    console.error('⚠️  Certifique-se de executar de: C:\\Users\\CleitonSanchesBR-iT\\Documents\\FinancialApps-def');
    process.exit(1);
}

// Criar pasta de exportação
if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
    console.log('✅ Pasta de exportação criada:', exportDir);
}

console.log('📂 Banco de dados:', dbPath);
console.log('📁 Pasta de exportação:', exportDir);
console.log('');

// Abrir banco
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco:', err.message);
        process.exit(1);
    }
    console.log('✅ Banco de dados conectado!\n');
});

// Função para escapar valores CSV
function escapeCsvValue(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

// Função para exportar tabela
function exportTable(tableName, callback) {
    const csvPath = path.join(exportDir, `${tableName}.csv`);
    
    console.log(`📤 Exportando ${tableName}...`);
    
    // Verificar se tabela existe e contar registros
    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
        if (err) {
            console.log(`   ⚠️  Tabela ${tableName} não existe (ignorando...)`);
            callback(false, 0);
            return;
        }
        
        const count = row.count;
        if (count === 0) {
            console.log(`   ⚠️  Tabela ${tableName} está vazia`);
            // Criar arquivo vazio com headers
            db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
                if (!err && columns && columns.length > 0) {
                    const headers = columns.map(col => col.name).join(',');
                    fs.writeFileSync(csvPath, headers + '\n', 'utf8');
                }
                callback(true, 0);
            });
            return;
        }
        
        // Buscar estrutura da tabela primeiro
        db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
            if (err || !columns || columns.length === 0) {
                console.log(`   ❌ Erro ao obter estrutura da tabela: ${err?.message || 'sem colunas'}`);
                callback(false, 0);
                return;
            }
            
            const columnNames = columns.map(col => col.name);
            
            // Buscar todos os dados
            db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
                if (err) {
                    console.log(`   ❌ Erro ao buscar dados: ${err.message}`);
                    callback(false, 0);
                    return;
                }
                
                if (rows.length === 0) {
                    console.log(`   ⚠️  Tabela ${tableName} está vazia`);
                    const headers = columnNames.join(',');
                    fs.writeFileSync(csvPath, headers + '\n', 'utf8');
                    callback(true, 0);
                    return;
                }
                
                // Criar CSV com headers
                const headers = columnNames.join(',');
                const csvRows = rows.map(row => {
                    return columnNames.map(colName => {
                        const val = row[colName];
                        return escapeCsvValue(val);
                    }).join(',');
                });
                
                const csvContent = headers + '\n' + csvRows.join('\n');
                
                // Escrever arquivo
                fs.writeFileSync(csvPath, csvContent, 'utf8');
                
                const fileSize = fs.statSync(csvPath).size;
                console.log(`   ✅ Exportado: ${tableName}.csv (${count} registros, ${(fileSize / 1024).toFixed(2)} KB)`);
                callback(true, count);
            });
        });
    });
}

// Buscar todas as tabelas do banco
console.log('🔍 Buscando todas as tabelas do banco de dados...\n');

db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`, (err, tables) => {
    if (err) {
        console.error('❌ Erro ao buscar tabelas:', err.message);
        db.close();
        process.exit(1);
    }
    
    if (!tables || tables.length === 0) {
        console.error('❌ Nenhuma tabela encontrada no banco de dados!');
        db.close();
        process.exit(1);
    }
    
    const tableNames = tables.map(t => t.name);
    console.log(`📋 Encontradas ${tableNames.length} tabelas:`);
    tableNames.forEach((name, idx) => {
        console.log(`   ${idx + 1}. ${name}`);
    });
    console.log('');
    
    // Exportar todas as tabelas
    let exportedCount = 0;
    let failedCount = 0;
    let totalRecords = 0;
    let currentIndex = 0;
    
    function exportNext() {
        if (currentIndex >= tableNames.length) {
            // Finalizado
            console.log('\n========================================');
            console.log('📊 Resumo da Exportação');
            console.log('========================================');
            console.log(`✅ Exportadas: ${exportedCount} tabelas`);
            console.log(`⚠️  Falhadas/Ignoradas: ${failedCount} tabelas`);
            console.log(`📊 Total de registros: ${totalRecords.toLocaleString()}`);
            console.log(`📁 Local: ${exportDir}\n`);
            
            // Criar arquivo de metadados
            const metadataPath = path.join(exportDir, 'EXPORT_INFO.txt');
            const metadata = `Exportação Completa para SQL Server - FinancialApps
Data: ${new Date().toISOString()}
Banco de origem: ${dbPath}

Tabelas exportadas: ${exportedCount}
Total de registros: ${totalRecords.toLocaleString()}

INSTRUÇÕES PARA IMPORTAÇÃO NO SQL SERVER:
1. Certifique-se de que todas as tabelas foram criadas no SQL Server (use migrations do TypeORM)
2. Verifique a ordem de importação para respeitar foreign keys
3. Importe primeiro tabelas sem dependências (companies, users, etc.)
4. Depois importe tabelas dependentes (proposals, invoices, etc.)

ORDEM RECOMENDADA DE IMPORTAÇÃO:
1. companies
2. users
3. service_types
4. chart_of_accounts
5. bank_accounts
6. clients
7. contacts
8. subscription_products
9. proposal_templates
10. project_templates
11. project_template_phases
12. project_template_tasks
13. proposals
14. proposal_aditivos
15. projects
16. phases
17. project_tasks
18. invoices
19. invoice_tax
20. invoice_history
21. account_payables
22. invoice_account_payable
23. reimbursements
24. time_entries

NOTA: Algumas tabelas podem precisar de ajustes de tipos de dados entre SQLite e SQL Server.
`;
            
            fs.writeFileSync(metadataPath, metadata, 'utf8');
            console.log('📄 Arquivo de informações criado: EXPORT_INFO.txt');
            console.log('\n✅ Exportação concluída!');
            console.log('📦 Próximo passo: Importar os CSV no SQL Server');
            
            db.close();
            process.exit(0);
            return;
        }
        
        const tableName = tableNames[currentIndex++];
        exportTable(tableName, (success, recordCount) => {
            if (success) {
                exportedCount++;
                totalRecords += recordCount;
            } else {
                failedCount++;
            }
            exportNext();
        });
    }
    
    // Iniciar exportação
    exportNext();
});

