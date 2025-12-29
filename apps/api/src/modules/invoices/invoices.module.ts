import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceTax } from '../../database/entities/invoice.entity';
import { Proposal } from '../../database/entities/proposal.entity';
import { ChartOfAccounts } from '../../database/entities/chart-of-accounts.entity';
import { BankAccount } from '../../database/entities/bank-account.entity';
import { TimeEntry } from '../../database/entities/time-entry.entity';
import { InvoiceHistory } from '../../database/entities/invoice-history.entity';
import { User } from '../../database/entities/user.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceTax, Proposal, ChartOfAccounts, BankAccount, TimeEntry, InvoiceHistory, User])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}



