import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { SubscriptionProductsService } from './subscription-products.service';
import { SubscriptionProduct } from '../../database/entities/subscription-product.entity';

@Controller('subscription-products')
export class SubscriptionProductsController {
  constructor(
    private readonly subscriptionProductsService: SubscriptionProductsService,
  ) {}

  @Get()
  async findAll(
    @Request() req: any,
    @Query('companyId') companyId?: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<SubscriptionProduct[]> {
    const userCompanyId = req.user?.companyId || companyId;
    
    if (activeOnly === 'true') {
      return this.subscriptionProductsService.findByCompany(userCompanyId, true);
    }
    
    return this.subscriptionProductsService.findAll(userCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<SubscriptionProduct> {
    return this.subscriptionProductsService.findOne(id);
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() productData: Partial<SubscriptionProduct>,
  ): Promise<SubscriptionProduct> {
    // Garantir que companyId está presente
    if (!productData.companyId && req.user?.companyId) {
      productData.companyId = req.user.companyId;
    }
    
    if (!productData.companyId) {
      throw new Error('companyId é obrigatório');
    }
    
    return this.subscriptionProductsService.create(productData);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() productData: Partial<SubscriptionProduct>,
  ): Promise<SubscriptionProduct> {
    return this.subscriptionProductsService.update(id, productData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.subscriptionProductsService.delete(id);
    return { message: 'Produto de assinatura deletado com sucesso' };
  }
}

