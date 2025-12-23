const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando setup do FinancialApps...\n');

// Verificar se o banco de dados já existe
const dbPath = path.join(process.cwd(), 'database.sqlite');
const dbExists = fs.existsSync(dbPath);

if (dbExists) {
  console.log('⚠️  Banco de dados já existe. Pulando criação de tabelas...');
  console.log('   Se quiser recriar, delete o arquivo database.sqlite e execute novamente.\n');
} else {
  console.log('📦 Criando banco de dados e tabelas...');
  try {
    execSync('npm run init:db --workspace=apps/api', { stdio: 'inherit' });
    console.log('✅ Banco de dados criado com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao criar banco de dados:', error.message);
    process.exit(1);
  }
}

// Verificar se já existem usuários (tentando fazer seed)
console.log('👤 Criando usuários iniciais...');
try {
  execSync('npm run seed:admin --workspace=apps/api', { stdio: 'inherit' });
  console.log('\n✅ Setup concluído com sucesso!');
  console.log('\n📋 Credenciais para login:');
  console.log('   Email: admin@financeapp.com');
  console.log('   Senha: admin123');
  console.log('\n   Email: user@financeapp.com');
  console.log('   Senha: user123');
  console.log('\n🌐 Para iniciar os servidores, execute:');
  console.log('   npm run dev');
  console.log('   ou');
  console.log('   npm start\n');
} catch (error) {
  console.error('❌ Erro ao criar usuários:', error.message);
  process.exit(1);
}

