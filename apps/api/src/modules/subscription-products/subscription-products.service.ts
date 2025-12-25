import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionProduct } from '../../database/entities/subscription-product.entity';

@Injectable()
export class SubscriptionProductsService {
  constructor(
    @InjectRepository(SubscriptionProduct)
    private subscriptionProductRepository: Repository<SubscriptionProduct>,
  ) {}

  async findAll(companyId?: string): Promise<SubscriptionProduct[]> {
    if (companyId) {
      return this.subscriptionProductRepository.find({ 
        where: { companyId },
        order: { name: 'ASC' }
      });
    }
    return this.subscriptionProductRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<SubscriptionProduct> {
    const product = await this.subscriptionProductRepository.findOne({ 
      where: { id },
      relations: ['company']
    });
    
    if (!product) {
      throw new NotFoundException(`Produto de assinatura com ID ${id} não encontrado`);
    }
    
    return product;
  }

  async create(productData: Partial<SubscriptionProduct>): Promise<SubscriptionProduct> {
    // Verificar se já existe produto com mesmo código na empresa
    if (productData.code && productData.companyId) {
      const existing = await this.subscriptionProductRepository.findOne({
        where: {
          companyId: productData.companyId,
          code: productData.code
        }
      });
      
      if (existing) {
        throw new BadRequestException(`Já existe um produto com o código ${productData.code} nesta empresa`);
      }
    }
    
    const product = this.subscriptionProductRepository.create(productData);
    return this.subscriptionProductRepository.save(product);
  }

  async update(id: string, productData: Partial<SubscriptionProduct>): Promise<SubscriptionProduct> {
    const product = await this.findOne(id);
    
    // Verificar se código está sendo alterado e se já existe
    if (productData.code && productData.code !== product.code && product.companyId) {
      const existing = await this.subscriptionProductRepository.findOne({
        where: {
          companyId: product.companyId,
          code: productData.code
        }
      });
      
      if (existing) {
        throw new BadRequestException(`Já existe um produto com o código ${productData.code} nesta empresa`);
      }
    }
    
    await this.subscriptionProductRepository.update(id, productData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.subscriptionProductRepository.delete(id);
  }

  async findByCompany(companyId: string, activeOnly: boolean = false): Promise<SubscriptionProduct[]> {
    const where: any = { companyId };
    if (activeOnly) {
      where.active = true;
    }
    
    return this.subscriptionProductRepository.find({
      where,
      order: { name: 'ASC' }
    });
  }
}

