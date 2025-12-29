import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsPayableController } from './accounts-payable.controller';
import { AccountsPayableService } from './accounts-payable.service';
import { AccountPayable } from '../../database/entities/account-payable.entity';
import { InvoiceAccountPayable } from '../../database/entities/invoice-account-payable.entity';
import { Invoice } from '../../database/entities/invoice.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountPayable, InvoiceAccountPayable, Invoice])],
  controllers: [AccountsPayableController],
  providers: [AccountsPayableService],
  exports: [AccountsPayableService],
})
export class AccountsPayableModule {}

