import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReimbursementsController } from './reimbursements.controller';
import { ReimbursementsService } from './reimbursements.service';
import { Reimbursement } from '../../database/entities/reimbursement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reimbursement])],
  controllers: [ReimbursementsController],
  providers: [ReimbursementsService],
  exports: [ReimbursementsService],
})
export class ReimbursementsModule {}

