module.exports = {
  apps: [
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
        NODE_ENV: 'production'
      },
      error_file: '/var/www/FinancialApps-def/logs/api-error.log',
      out_file: '/var/www/FinancialApps-def/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'financial-web',
      script: 'npm',
      args: 'run start --workspace=apps/web',
      cwd: '/var/www/FinancialApps-def',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/www/FinancialApps-def/logs/web-error.log',
      out_file: '/var/www/FinancialApps-def/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}

