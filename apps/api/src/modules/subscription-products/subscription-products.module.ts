import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionProduct } from '../../database/entities/subscription-product.entity';
import { SubscriptionProductsService } from './subscription-products.service';
import { SubscriptionProductsController } from './subscription-products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SubscriptionProduct])],
  controllers: [SubscriptionProductsController],
  providers: [SubscriptionProductsService],
  exports: [SubscriptionProductsService],
})
export class SubscriptionProductsModule {}

