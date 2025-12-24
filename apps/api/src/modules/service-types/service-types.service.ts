import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceType } from '../../database/entities/service-type.entity';

@Injectable()
export class ServiceTypesService {
  constructor(
    @InjectRepository(ServiceType)
    private serviceTypeRepository: Repository<ServiceType>,
  ) {}

  async findAll(companyId?: string): Promise<ServiceType[]> {
    const where: any = { active: true };
    if (companyId) {
      where.companyId = companyId;
    }
    return this.serviceTypeRepository.find({ 
      where,
      order: { name: 'ASC' },
    });
  }

  async findAllIncludingInactive(companyId?: string): Promise<ServiceType[]> {
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    return this.serviceTypeRepository.find({ 
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ServiceType> {
    return this.serviceTypeRepository.findOne({ where: { id } });
  }

  async create(serviceTypeData: Partial<ServiceType>): Promise<ServiceType> {
    const serviceType = this.serviceTypeRepository.create(serviceTypeData);
    return this.serviceTypeRepository.save(serviceType);
  }

  async update(id: string, serviceTypeData: Partial<ServiceType>): Promise<ServiceType> {
    await this.serviceTypeRepository.update(id, serviceTypeData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.serviceTypeRepository.delete(id);
  }
}

