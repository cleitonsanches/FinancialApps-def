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
import { ensureInvoiceChartOfAccounts } from './database/ensure-invoice-chart-of-accounts';
import { ensureProposalServiceFields } from './database/ensure-proposal-service-fields';
import { ensureProposalAditivosTable } from './database/ensure-proposal-aditivos-table';
import { ensureSubscriptionProductsTable } from './database/ensure-subscription-products-table';
import { ensureInvoiceRecebimentoFields } from './database/ensure-invoice-recebimento-fields';
import { ensureProposalValidadeFields } from './database/ensure-proposal-validade-fields';
import { ensureProjectTaskTipoFields } from './database/ensure-project-task-tipo-fields';
import { ensureTimeEntriesTable } from './database/ensure-time-entries-table';
import { ensureTimeEntriesVinculos } from './database/ensure-time-entries-vinculos';
import { ensureTimeEntryStatus } from './database/ensure-time-entry-status';
import { ensureProjectTaskVinculos } from './database/ensure-project-task-vinculos';
import { ensureProjectTaskExigirHoras } from './database/ensure-project-task-exigir-horas';
import { ensureAccountsPayableTable } from './database/ensure-accounts-payable-table';
import { ensureReimbursementsTable } from './database/ensure-reimbursements-table';
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
import { SubscriptionProductsModule } from './modules/subscription-products/subscription-products.module';
import { ProposalAditivosModule } from './modules/proposal-aditivos/proposal-aditivos.module';
import { AccountsPayableModule } from './modules/accounts-payable/accounts-payable.module';
import { ReimbursementsModule } from './modules/reimbursements/reimbursements.module';

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
    SubscriptionProductsModule,
    ProposalAditivosModule,
    AccountsPayableModule,
    ReimbursementsModule,
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
    // Garantir que a coluna chart_of_accounts_id existe na tabela invoices
    await ensureInvoiceChartOfAccounts(this.dataSource);
    // Garantir que os campos específicos de serviços existem na tabela proposals
    await ensureProposalServiceFields(this.dataSource);
    // Garantir que a tabela proposal_aditivos existe
    await ensureProposalAditivosTable(this.dataSource);
    // Garantir que a tabela subscription_products existe
    await ensureSubscriptionProductsTable(this.dataSource);
    // Garantir que os campos de recebimento existem na tabela invoices
    await ensureInvoiceRecebimentoFields(this.dataSource);
    // Garantir que os campos de validade existem na tabela proposals
    await ensureProposalValidadeFields(this.dataSource);
    // Garantir que os campos de tipo existem na tabela project_tasks
    await ensureProjectTaskTipoFields(this.dataSource);
    // Garantir que a tabela time_entries existe
    await ensureTimeEntriesTable(this.dataSource);
    // Garantir que os campos de vínculos (proposal_id, client_id) existem na tabela time_entries
    await ensureTimeEntriesVinculos(this.dataSource);
    // Garantir que o campo status existe na tabela time_entries
    await ensureTimeEntryStatus(this.dataSource);
    // Garantir que os campos de vínculos (proposal_id, client_id) existem na tabela project_tasks
    await ensureProjectTaskVinculos(this.dataSource);
    // Garantir que o campo exigir_lancamento_horas existe na tabela project_tasks
    await ensureProjectTaskExigirHoras(this.dataSource);
    // Garantir que a tabela accounts_payable existe
    await ensureAccountsPayableTable(this.dataSource);
    // Garantir que a tabela reimbursements existe
    await ensureReimbursementsTable(this.dataSource);
  }
}


