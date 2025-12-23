import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { UsersModule } from './modules/users/users.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { ProposalTemplatesModule } from './modules/proposal-templates/proposal-templates.module';
import { ProposalTemplateFieldsModule } from './modules/proposal-template-fields/proposal-template-fields.module';
import { ProjectTemplatesModule } from './modules/project-templates/project-templates.module';
import { ProjectTemplateTasksModule } from './modules/project-template-tasks/project-template-tasks.module';
import { ChartOfAccountsModule } from './modules/chart-of-accounts/chart-of-accounts.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';

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
    UsersModule,
    ClientsModule,
    ContactsModule,
    ProposalsModule,
    ProposalTemplatesModule,
    ProposalTemplateFieldsModule,
    ProjectTemplatesModule,
    ProjectTemplateTasksModule,
    ChartOfAccountsModule,
    BankAccountsModule,
  ],
})
export class AppModule {}
