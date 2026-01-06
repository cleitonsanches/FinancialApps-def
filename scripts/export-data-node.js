// Script Node.js para exportar dados de referencia do banco local
// Execute: node scripts/export-data-node.js

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando exportacao de dados...\n');

// Caminhos
const projectRoot = __dirname + '/..';
const dbPath = path.join(projectRoot, 'apps', 'api', 'database.sqlite');
const exportDir = path.join(projectRoot, 'export');

// Verificar se o banco existe
if (!fs.existsSync(dbPath)) {
    console.error('❌ Banco de dados nao encontrado em:', dbPath);
    console.error('⚠️  Tente executar de: C:\\Users\\CleitonSanchesBR-iT\\Documents\\FinancialApps-def');
    process.exit(1);
}

// Criar pasta de exportacao
if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
    console.log('✅ Pasta de exportacao criada:', exportDir);
}

console.log('📂 Banco de dados:', dbPath);
console.log('📁 Pasta de exportacao:', exportDir);
console.log('');

// Tabelas a exportar
const tables = [
    { name: 'service_types', file: 'service_types.csv', required: false },
    { name: 'chart_of_accounts', file: 'chart_of_accounts.csv', required: true },
    { name: 'bank_accounts', file: 'bank_accounts.csv', required: true },
    { name: 'clients', file: 'clients.csv', required: true },
    { name: 'contacts', file: 'contacts.csv', required: false },
    { name: 'proposal_templates', file: 'proposal_templates.csv', required: false },
    { name: 'project_templates', file: 'project_templates.csv', required: false },
    { name: 'project_template_phases', file: 'project_template_phases.csv', required: false },
    { name: 'project_template_tasks', file: 'project_template_tasks.csv', required: false },
    { name: 'subscription_products', file: 'subscription_products.csv', required: false }
];

// Abrir banco
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco:', err.message);
        process.exit(1);
    }
    console.log('✅ Banco de dados conectado!\n');
});

// Funcao para exportar tabela
function exportTable(tableName, fileName, callback) {
    const csvPath = path.join(exportDir, fileName);
    
    console.log(`📤 Exportando ${tableName}...`);
    
    // Verificar se tabela existe e contar registros
    db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
        if (err) {
            console.log(`   ⚠️  Tabela ${tableName} nao existe ou esta vazia (ignorando...)`);
            callback(false);
            return;
        }
        
        const count = row.count;
        if (count === 0) {
            console.log(`   ⚠️  Tabela ${tableName} esta vazia (ignorando...)`);
            callback(false);
            return;
        }
        
        // Buscar todos os dados
        db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
            if (err) {
                console.log(`   ❌ Erro ao buscar dados: ${err.message}`);
                callback(false);
                return;
            }
            
            if (rows.length === 0) {
                console.log(`   ⚠️  Tabela ${tableName} esta vazia (ignorando...)`);
                callback(false);
                return;
            }
            
            // Criar CSV
            const headers = Object.keys(rows[0]).join(',');
            const csvRows = rows.map(row => {
                return Object.values(row).map(val => {
                    if (val === null || val === undefined) return '';
                    // Escapar aspas e vírgulas
                    const str = String(val);
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                }).join(',');
            });
            
            const csvContent = headers + '\n' + csvRows.join('\n');
            
            // Escrever arquivo
            fs.writeFileSync(csvPath, csvContent, 'utf8');
            
            const fileSize = fs.statSync(csvPath).size;
            console.log(`   ✅ Exportado: ${fileName} (${count} registros, ${(fileSize / 1024).toFixed(2)} KB)`);
            callback(true);
        });
    });
}

// Exportar todas as tabelas
let exportedCount = 0;
let failedCount = 0;
let currentIndex = 0;

function exportNext() {
    if (currentIndex >= tables.length) {
        // Finalizado
        console.log('\n========================================');
        console.log('📊 Resumo da Exportacao');
        console.log('========================================');
        console.log(`✅ Exportadas: ${exportedCount} tabelas`);
        console.log(`⚠️  Ignoradas: ${failedCount} tabelas`);
        console.log(`📁 Local: ${exportDir}\n`);
        
        // Criar arquivo de metadados
        const metadataPath = path.join(exportDir, 'export-info.txt');
        const metadata = `Exportacao de Dados - FinancialApps
Data: ${new Date().toISOString()}
Banco de origem: ${dbPath}

Tabelas exportadas:
${tables.map(t => `  - ${t.file}`).join('\n')}

INSTRUCOES:
1. Verifique se todos os arquivos CSV foram criados
2. Copie a pasta 'export' para a VPS
3. Na VPS, execute: ./scripts/import-data.sh
4. ATENCAO: Ajuste o company_id antes de importar (veja ajustar-company-id.sh)
`;
        
        fs.writeFileSync(metadataPath, metadata, 'utf8');
        console.log('📄 Arquivo de informacoes criado: export-info.txt');
        console.log('\n✅ Exportacao concluida!');
        console.log('📦 Proximo passo: Copie a pasta "export" para a VPS');
        
        db.close();
        process.exit(0);
        return;
    }
    
    const table = tables[currentIndex++];
    exportTable(table.name, table.file, (success) => {
        if (success) {
            exportedCount++;
        } else {
            failedCount++;
            if (table.required) {
                console.log(`   ⚠️  ATENCAO: Tabela ${table.name} eh importante mas nao foi exportada!`);
            }
        }
        exportNext();
    });
}

// Iniciar exportacao
exportNext();




