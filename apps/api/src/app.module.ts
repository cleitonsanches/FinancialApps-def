import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ChartOfAccountsModule } from './modules/chart-of-accounts/chart-of-accounts.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { ProposalsModule } from './modules/proposals/proposals.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ProjectTemplatesModule } from './modules/project-templates/project-templates.module';
import { UsersModule } from './modules/users/users.module';

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
    UsersModule,
  ],
})
export class AppModule {}


