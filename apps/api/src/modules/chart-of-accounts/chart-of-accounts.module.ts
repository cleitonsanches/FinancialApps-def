import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChartOfAccount } from '../../database/entities/chart-of-accounts.entity';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { ChartOfAccountsController } from './chart-of-accounts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChartOfAccount])],
  controllers: [ChartOfAccountsController],
  providers: [ChartOfAccountsService],
  exports: [ChartOfAccountsService],
})
export class ChartOfAccountsModule {}

