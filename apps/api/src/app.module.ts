import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseConfig } from './config/database.config';
import { ensureProposalNumeroColumn } from './database/ensure-proposal-numero';
import { ensureProposalStatusDatesColumns } from './database/ensure-proposal-status-dates';
import { ensureInvoiceFields } from './database/ensure-invoice-fields';
import { ensureProposalMotivoFields } from './database/ensure-proposal-motivo-fields';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ChartOfAccountsModule } from './modules/chart-of-accounts/chart-of-accounts.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ProjectTemplatesModule } from './modules/project-templates/project-templates.module';
import { ProposalTemplatesModule } from './modules/proposal-templates/proposal-templates.module';
import { UsersModule } from './modules/users/users.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ServiceTypesModule } from './modules/service-types/service-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),
    AuthModule,
    CompanyModule,
    ClientsModule,
    ChartOfAccountsModule,
    BankAccountsModule,
    ProposalsModule,
    InvoicesModule,
    ProjectsModule,
    ProjectTemplatesModule,
    ProposalTemplatesModule,
    UsersModule,
    ContactsModule,
    ServiceTypesModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async onModuleInit() {
    // Garantir que a coluna numero existe na tabela proposals
    await ensureProposalNumeroColumn(this.dataSource);
    // Garantir que as colunas de data de status existem na tabela proposals
    await ensureProposalStatusDatesColumns(this.dataSource);
    // Garantir que as colunas data_recebimento e numero_nf existem na tabela invoices
    await ensureInvoiceFields(this.dataSource);
    // Garantir que as colunas motivo_cancelamento e motivo_declinio existem na tabela proposals
    await ensureProposalMotivoFields(this.dataSource);
  }
}


