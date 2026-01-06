#!/bin/sh

# Script para verificar se a API consegue encontrar usuários no banco
# Execute: sh VERIFICAR_USUARIOS_BANCO.sh

echo "=========================================="
echo "VERIFICAR USUÁRIOS NO BANCO"
echo "=========================================="
echo ""

# Verificar se está no diretório correto
if [ ! -f "ecosystem.config.js" ]; then
    echo "❌ Erro: ecosystem.config.js não encontrado!"
    exit 1
fi

# Verificar se o build existe
if [ ! -f "apps/api/dist/main.js" ]; then
    echo "⚠️  Build não encontrado. Fazendo build..."
    npm run build:api
fi

# Tentar ler credenciais do ecosystem.config.js (produção)
echo "Lendo credenciais do banco de PRODUÇÃO..."
DB_HOST=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_HOST" | head -1 | sed "s/.*DB_HOST.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_USERNAME=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_USERNAME" | head -1 | sed "s/.*DB_USERNAME.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_PASSWORD=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_PASSWORD" | head -1 | sed "s/.*DB_PASSWORD.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")
DB_DATABASE=$(grep -A 20 "financial-api-prod" ecosystem.config.js | grep "DB_DATABASE" | head -1 | sed "s/.*DB_DATABASE.*'\(.*\)'.*/\1/" | sed "s/.*||.*'\''\(.*\)'\''.*/\1/")

# Se não conseguiu ler, pedir ao usuário
if [ -z "$DB_HOST" ] || [ "$DB_HOST" = "seu-servidor.database.windows.net" ]; then
    echo "⚠️  Não foi possível ler do ecosystem.config.js"
    echo ""
    echo "Por favor, informe as credenciais do banco de PRODUÇÃO:"
    echo ""
    printf "DB_HOST: "
    read DB_HOST
    printf "DB_USERNAME: "
    read DB_USERNAME
    printf "DB_PASSWORD: "
    read DB_PASSWORD
    printf "DB_DATABASE [free-db-financeapp]: "
    read DB_DATABASE
    DB_DATABASE=${DB_DATABASE:-free-db-financeapp}
else
    echo "✅ Credenciais lidas do ecosystem.config.js"
    echo "   Database: $DB_DATABASE"
fi

echo ""
echo "Criando script para verificar usuários..."
echo ""

# Criar script Node.js para verificar usuários
cat > /tmp/check-users.js << 'EOF'
const { DataSource } = require('typeorm');
const path = require('path');

// Mudar para o diretório do projeto
process.chdir(process.env.PROJECT_DIR || '/var/www/FinancialApps-def');

// Importar entidade User
const User = require(path.join(process.cwd(), 'apps/api/dist/database/entities/user.entity')).User;

async function checkUsers() {
  const dataSource = new DataSource({
    type: 'mssql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '1433'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [User],
    synchronize: false,
    logging: false,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      enableArithAbort: true,
    },
  });

  try {
    console.log('Conectando ao banco de dados...');
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.DB_DATABASE}`);
    console.log(`   Username: ${process.env.DB_USERNAME}\n`);
    
    await dataSource.initialize();
    console.log('✅ Conectado!\n');

    const userRepository = dataSource.getRepository(User);
    
    // Buscar todos os usuários
    console.log('Buscando usuários no banco...');
    const users = await userRepository.find({
      select: ['id', 'name', 'email', 'companyId'],
    });

    console.log(`\n📊 Total de usuários encontrados: ${users.length}\n`);

    if (users.length > 0) {
      console.log('Usuários encontrados:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`);
      });
      
      // Verificar usuários específicos
      console.log('\nVerificando usuários específicos:');
      const testEmails = [
        'admin@financeapp.com',
        'cleiton.sanches@financeapp.com',
        'user@financeapp.com'
      ];
      
      for (const email of testEmails) {
        const user = await userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'companyId'],
        });
        
        if (user) {
          console.log(`   ✅ ${email} - ENCONTRADO (${user.name})`);
        } else {
          console.log(`   ❌ ${email} - NÃO ENCONTRADO`);
        }
      }
    } else {
      console.log('⚠️  NENHUM usuário encontrado no banco!');
      console.log('   Isso explica o erro de autenticação.');
    }

    await dataSource.destroy();
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    if (err.stack) {
      console.error('\nStack:', err.stack);
    }
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

checkUsers();
EOF

cd /var/www/FinancialApps-def

PROJECT_DIR="/var/www/FinancialApps-def" \
DB_HOST="$DB_HOST" \
DB_DATABASE="$DB_DATABASE" \
DB_USERNAME="$DB_USERNAME" \
DB_PASSWORD="$DB_PASSWORD" \
DB_PORT=1433 \
node /tmp/check-users.js

EXIT_CODE=$?
rm -f /tmp/check-users.js

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "VERIFICAÇÃO CONCLUÍDA"
    echo "=========================================="
    echo ""
    echo "Se os usuários foram encontrados mas a API não consegue fazer login:"
    echo "1. Verifique se a API está usando as mesmas credenciais"
    echo "2. Verifique os logs da API: pm2 logs financial-api-prod"
    echo "3. Reinicie a API: pm2 restart financial-api-prod"
else
    echo ""
    echo "=========================================="
    echo "ERRO NA VERIFICAÇÃO"
    echo "=========================================="
fi

