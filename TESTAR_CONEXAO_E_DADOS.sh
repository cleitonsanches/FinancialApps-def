#!/bin/bash

# Script para testar conexão com banco e buscar dados de clientes
# Execute: bash TESTAR_CONEXAO_E_DADOS.sh

echo "🔍 Testando conexão e dados do banco..."
echo ""

cd /var/www/FinancialApps-def

# Verificar se .env.local existe
if [ ! -f "apps/api/.env.local" ]; then
    echo "❌ apps/api/.env.local não existe!"
    exit 1
fi

# Carregar variáveis de ambiente
export $(grep -v '^#' apps/api/.env.local | xargs)

echo "=========================================="
echo "1. VERIFICANDO VARIÁVEIS DE AMBIENTE"
echo "=========================================="
echo "DB_TYPE: $DB_TYPE"
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "DB_DATABASE: $DB_DATABASE"
echo "DB_USERNAME: $DB_USERNAME"
echo "DB_PASSWORD: (oculto)"
echo ""

echo "=========================================="
echo "2. TESTANDO CONECTIVIDADE"
echo "=========================================="
echo "Testando conexão TCP com $DB_HOST:1433..."
timeout 5 bash -c "echo > /dev/tcp/$DB_HOST/1433" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Porta 1433 está acessível"
else
    echo "❌ Porta 1433 NÃO está acessível"
    echo "   Problema de firewall ou rede!"
    exit 1
fi
echo ""

echo "=========================================="
echo "3. TESTANDO CONEXÃO COM NODE.JS"
echo "=========================================="

# Criar script temporário para testar conexão
cat > /tmp/test-connection.js << 'NODE_SCRIPT'
const sql = require('mssql');

async function testConnection() {
    const config = {
        server: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '1433'),
        database: process.env.DB_DATABASE,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        options: {
            encrypt: true,
            trustServerCertificate: false,
            enableArithAbort: true,
            connectionTimeout: 30000,
            requestTimeout: 30000
        }
    };

    console.log('Tentando conectar ao banco...');
    console.log(`Host: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log(`User: ${config.user}`);
    
    try {
        const pool = await sql.connect(config);
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Testar query simples
        console.log('\nTestando query simples...');
        const result = await pool.request().query('SELECT 1 as test');
        console.log('✅ Query executada com sucesso:', result.recordset);
        
        // Verificar se tabela clients existe
        console.log('\nVerificando se tabela clients existe...');
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'clients'
        `);
        console.log('Resultado:', tableCheck.recordset);
        
        if (tableCheck.recordset[0].count > 0) {
            console.log('✅ Tabela clients existe');
            
            // Contar registros
            console.log('\nContando registros na tabela clients...');
            const countResult = await pool.request().query('SELECT COUNT(*) as total FROM clients');
            console.log('Total de clientes:', countResult.recordset[0].total);
            
            // Buscar alguns registros
            console.log('\nBuscando primeiros 5 registros...');
            const clientsResult = await pool.request().query(`
                SELECT TOP 5 
                    id, 
                    name, 
                    razao_social,
                    is_cliente,
                    is_fornecedor,
                    is_colaborador,
                    company_id
                FROM clients
            `);
            console.log('Registros encontrados:', clientsResult.recordset.length);
            clientsResult.recordset.forEach((client, index) => {
                console.log(`\nCliente ${index + 1}:`);
                console.log(`  ID: ${client.id}`);
                console.log(`  Name: ${client.name || 'N/A'}`);
                console.log(`  Razão Social: ${client.razao_social || 'N/A'}`);
                console.log(`  is_cliente: ${client.is_cliente}`);
                console.log(`  is_fornecedor: ${client.is_fornecedor}`);
                console.log(`  is_colaborador: ${client.is_colaborador}`);
                console.log(`  company_id: ${client.company_id || 'N/A'}`);
            });
        } else {
            console.log('❌ Tabela clients NÃO existe!');
        }
        
        await pool.close();
        console.log('\n✅ Teste concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao conectar:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testConnection();
NODE_SCRIPT

cd apps/api
export $(grep -v '^#' .env.local | xargs)
node /tmp/test-connection.js

echo ""
echo "=========================================="
echo "4. VERIFICANDO LOGS DA API"
echo "=========================================="
echo "Últimas 30 linhas do log de erro:"
tail -30 ../logs/api-error.log 2>/dev/null || echo "Log não encontrado"
echo ""

echo "=========================================="
echo "5. VERIFICANDO SE API ESTÁ RODANDO"
echo "=========================================="
pm2 status | grep financial-api || echo "API não está rodando!"
echo ""

echo "=========================================="
echo "6. TESTANDO ENDPOINT DA API"
echo "=========================================="
echo "Testando GET /clients..."
curl -s http://localhost:3001/clients 2>&1 | head -50 || echo "Erro ao fazer requisição"
echo ""
