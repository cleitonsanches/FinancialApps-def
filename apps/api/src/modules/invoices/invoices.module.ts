import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice, InvoiceTax } from '../../database/entities/invoice.entity';
import { Proposal } from '../../database/entities/proposal.entity';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceTax, Proposal])],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}



