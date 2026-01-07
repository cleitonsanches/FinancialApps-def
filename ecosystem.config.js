// Carregar variáveis de ambiente de um arquivo .env.pm2 (não versionado)
// Procurar primeiro no diretório do projeto, depois no home do usuário
const path = require('path');
const fs = require('fs');
const os = require('os');

let envPath = path.join(process.cwd(), '.env.pm2');
if (!fs.existsSync(envPath)) {
  envPath = path.join(os.homedir(), '.env-pm2');
}

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

module.exports = {
  apps: [
    // ============================================
    // INSTÂNCIA ÚNICA DE PRODUÇÃO
    // ============================================
    {
      name: 'financial-api',
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/var/www/FinancialApps-def',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Banco de dados - lê do .env.pm2 ou usa valores padrão
        DB_TYPE: process.env.DB_TYPE || 'mssql',
        DB_HOST: process.env.DB_HOST_PROD || process.env.DB_HOST || 'seu-servidor.database.windows.net',
        DB_PORT: process.env.DB_PORT_PROD || process.env.DB_PORT || '1433',
        DB_USERNAME: process.env.DB_USERNAME_PROD || process.env.DB_USERNAME || 'seu-usuario',
        DB_PASSWORD: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD || 'sua-senha',
        DB_DATABASE: process.env.DB_DATABASE_PROD || process.env.DB_DATABASE || 'free-db-financeapp',
        FRONTEND_URL: process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'http://localhost:8080'
      },
      error_file: '/var/www/FinancialApps-def/logs/api-error.log',
      out_file: '/var/www/FinancialApps-def/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'financial-web',
      script: 'node',
      args: '.next/standalone/apps/web/server.js',
      cwd: '/var/www/FinancialApps-def/apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: '/api',
        HOSTNAME: 'localhost'
      },
      error_file: '/var/www/FinancialApps-def/logs/web-error.log',
      out_file: '/var/www/FinancialApps-def/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}
