#!/bin/bash

# Script para testar o endpoint de clients em diferentes cenários
# Execute: bash TESTAR_ENDPOINT_CLIENTS.sh

echo "🧪 Testando endpoint /api/clients em diferentes cenários..."
echo ""

# 1. Testar sem filtros
echo "=========================================="
echo "1. TESTE: GET /api/clients (sem filtros)"
echo "=========================================="
curl -s http://localhost:3001/api/clients | jq 'length' 2>/dev/null || curl -s http://localhost:3001/api/clients | head -100
echo ""

# 2. Testar com companyId específico
echo "=========================================="
echo "2. TESTE: GET /api/clients?companyId=xxx"
echo "=========================================="
echo "Primeiro, vamos ver qual companyId existe no banco..."
echo ""
echo "Para descobrir um companyId válido, teste:"
echo "curl http://localhost:3001/api/companies"
echo ""

# 3. Testar verificando se há dados no banco diretamente
echo "=========================================="
echo "3. VERIFICANDO DADOS DIRETAMENTE NO BANCO"
echo "=========================================="

cd /var/www/FinancialApps-def/apps/api

# Criar script Node.js temporário para consultar banco
cat > /tmp/check-clients.js << 'NODE_SCRIPT'
const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

async function checkClients() {
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

    try {
        console.log('Conectando ao banco...');
        const pool = await sql.connect(config);
        
        // Contar total de clientes
        const countResult = await pool.request().query('SELECT COUNT(*) as total FROM clients');
        console.log('Total de registros na tabela clients:', countResult.recordset[0].total);
        
        // Buscar alguns registros com company_id
        console.log('\nBuscando registros com company_id:');
        const clientsWithCompany = await pool.request().query(`
            SELECT TOP 10 
                id, 
                name, 
                razao_social,
                company_id,
                is_cliente,
                is_fornecedor,
                is_colaborador
            FROM clients
            ORDER BY created_at DESC
        `);
        
        console.log('Registros encontrados:', clientsWithCompany.recordset.length);
        clientsWithCompany.recordset.forEach((client, index) => {
            console.log(`\n${index + 1}. ID: ${client.id}`);
            console.log(`   Name: ${client.name || 'N/A'}`);
            console.log(`   Razão Social: ${client.razao_social || 'N/A'}`);
            console.log(`   company_id: ${client.company_id || 'N/A'}`);
            console.log(`   is_cliente: ${client.is_cliente} (tipo: ${typeof client.is_cliente})`);
            console.log(`   is_fornecedor: ${client.is_fornecedor} (tipo: ${typeof client.is_fornecedor})`);
            console.log(`   is_colaborador: ${client.is_colaborador} (tipo: ${typeof client.is_colaborador})`);
        });
        
        // Verificar se há registros com is_cliente = 1 ou true
        console.log('\nVerificando filtros booleanos:');
        const isCliente1 = await pool.request().query('SELECT COUNT(*) as total FROM clients WHERE is_cliente = 1');
        console.log('Clientes com is_cliente = 1:', isCliente1.recordset[0].total);
        
        const isFornecedor1 = await pool.request().query('SELECT COUNT(*) as total FROM clients WHERE is_fornecedor = 1');
        console.log('Clientes com is_fornecedor = 1:', isFornecedor1.recordset[0].total);
        
        // Listar company_ids únicos
        console.log('\nCompany IDs únicos na tabela clients:');
        const companyIds = await pool.request().query('SELECT DISTINCT company_id FROM clients WHERE company_id IS NOT NULL');
        companyIds.recordset.forEach(row => {
            console.log(`  - ${row.company_id}`);
        });
        
        await pool.close();
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error.message);
        process.exit(1);
    }
}

checkClients();
NODE_SCRIPT

export $(grep -v '^#' .env.local | xargs)
node /tmp/check-clients.js

echo ""
echo "=========================================="
echo "4. TESTAR ENDPOINT COM COMPANY_ID ESPECÍFICO"
echo "=========================================="
echo "Use um dos company_ids listados acima:"
echo "curl 'http://localhost:3001/api/clients?companyId=<ID_AQUI>'"
echo ""

# 5. Verificar logs da API
echo "=========================================="
echo "5. ÚLTIMOS LOGS DA API (procurando por 'clients')"
echo "=========================================="
cd ../..
tail -100 logs/api-out.log 2>/dev/null | grep -i "client" | tail -20 || echo "Nenhum log encontrado"
