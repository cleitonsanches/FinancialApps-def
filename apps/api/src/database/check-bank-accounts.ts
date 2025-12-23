import { DataSource } from 'typeorm';
import { join } from 'path';
import { BankAccount } from './entities/bank-account.entity';

async function checkBankAccounts() {
  const databasePath = join(process.cwd(), 'database.sqlite');
  
  const dataSource = new DataSource({
    type: 'sqlite',
    database: databasePath,
    entities: [BankAccount],
    synchronize: false,
    logging: true,
  });

  try {
    console.log('Conectando ao banco de dados...');
    await dataSource.initialize();
    console.log('Banco de dados conectado com sucesso!');
    
    const bankAccountRepository = dataSource.getRepository(BankAccount);
    
    // Buscar todas as contas
    const accounts = await bankAccountRepository.find();
    
    console.log(`\nTotal de contas encontradas: ${accounts.length}\n`);
    
    if (accounts.length === 0) {
      console.log('Nenhuma conta cadastrada no banco de dados.');
    } else {
      console.log('Contas cadastradas:');
      accounts.forEach((account, index) => {
        console.log(`\n${index + 1}. Conta ID: ${account.id}`);
        console.log(`   Banco: ${account.bankName}`);
        console.log(`   Agência: ${account.agency || 'N/A'}`);
        console.log(`   Conta: ${account.accountNumber}`);
        console.log(`   Tipo: ${account.accountType || 'N/A'}`);
        // Temporariamente comentado até a migração ser executada
        // console.log(`   Chave PIX: ${(account as any).pixKey || 'N/A'}`);
        console.log(`   Saldo Inicial: ${account.saldoInicial || 0}`);
        console.log(`   Status: ${account.status || 'N/A'}`);
        console.log(`   Company ID: ${account.companyId}`);
        console.log(`   Criado em: ${account.createdAt}`);
      });
    }
    
    // Verificar estrutura da tabela
    const queryRunner = dataSource.createQueryRunner();
    const table = await queryRunner.getTable('bank_accounts');
    
    if (table) {
      console.log('\n\nEstrutura da tabela bank_accounts:');
      table.columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type}) - nullable: ${col.isNullable}`);
      });
    }
    
    await queryRunner.release();
    await dataSource.destroy();
    console.log('\nConexão fechada.');
  } catch (error) {
    console.error('Erro ao verificar contas:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  checkBankAccounts();
}

export default checkBankAccounts;

