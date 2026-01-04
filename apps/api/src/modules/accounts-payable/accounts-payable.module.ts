import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountsPayableService } from './accounts-payable.service';
import { AccountPayable } from '../../database/entities/account-payable.entity';
import { InvoiceAccountPayable } from '../../database/entities/invoice-account-payable.entity';
import { Invoice } from '../../database/entities/invoice.entity';
import { AccountPayableHistory } from '../../database/entities/account-payable-history.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountPayable, InvoiceAccountPayable, Invoice, AccountPayableHistory, User])],
  controllers: [AccountsPayableController],
  providers: [AccountsPayableService],
  exports: [AccountsPayableService],
})
export class AccountsPayableModule {}

