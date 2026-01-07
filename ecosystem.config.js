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
    // INSTÂNCIA DE PRODUÇÃO
    // ============================================
    {
      name: 'financial-api-prod',
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
        // Banco de dados de produção - lê do .env.pm2 ou usa valores padrão
        DB_TYPE: process.env.DB_TYPE || 'mssql',
        DB_HOST: process.env.DB_HOST_PROD || process.env.DB_HOST || 'seu-servidor.database.windows.net',
        DB_PORT: process.env.DB_PORT_PROD || process.env.DB_PORT || '1433',
        DB_USERNAME: process.env.DB_USERNAME_PROD || process.env.DB_USERNAME || 'seu-usuario',
        DB_PASSWORD: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD || 'sua-senha',
        DB_DATABASE: process.env.DB_DATABASE_PROD || 'free-db-financeapp',
        FRONTEND_URL: process.env.FRONTEND_URL_PROD || 'http://seu-ip:8080'
      },
      error_file: '/var/www/FinancialApps-def/logs/api-prod-error.log',
      out_file: '/var/www/FinancialApps-def/logs/api-prod-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'financial-web-prod',
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
      error_file: '/var/www/FinancialApps-def/logs/web-prod-error.log',
      out_file: '/var/www/FinancialApps-def/logs/web-prod-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    // ============================================
    // INSTÂNCIA DE TESTES
    // ============================================
    {
      name: 'financial-api-test',
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/var/www/FinancialApps-def',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        // Banco de dados de testes - lê do .env.pm2 ou usa valores padrão
        DB_TYPE: process.env.DB_TYPE || 'mssql',
        DB_HOST: process.env.DB_HOST_TEST || process.env.DB_HOST || 'seu-servidor.database.windows.net',
        DB_PORT: process.env.DB_PORT_TEST || process.env.DB_PORT || '1433',
        DB_USERNAME: process.env.DB_USERNAME_TEST || process.env.DB_USERNAME || 'seu-usuario',
        DB_PASSWORD: process.env.DB_PASSWORD_TEST || process.env.DB_PASSWORD || 'sua-senha',
        DB_DATABASE: process.env.DB_DATABASE_TEST || 'free-db-financeapp-2',
        FRONTEND_URL: process.env.FRONTEND_URL_TEST || 'http://seu-ip:8080/test'
      },
      error_file: '/var/www/FinancialApps-def/logs/api-test-error.log',
      out_file: '/var/www/FinancialApps-def/logs/api-test-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'financial-web-test',
      script: 'node',
      args: '.next/standalone/apps/web/server.js',
      cwd: '/var/www/FinancialApps-def/apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        NEXT_PUBLIC_BASE_PATH: '/test',
        NEXT_PUBLIC_API_URL: '/test/api',
        HOSTNAME: 'localhost'
      },
      error_file: '/var/www/FinancialApps-def/logs/web-test-error.log',
      out_file: '/var/www/FinancialApps-def/logs/web-test-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}
