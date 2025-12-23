import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../../database/entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async findAll(): Promise<Company[]> {
    return this.companyRepository.find();
  }

  async findOne(id: string): Promise<Company> {
    return this.companyRepository.findOne({ where: { id } });
  }

  async create(companyData: Partial<Company>): Promise<Company> {
    const company = this.companyRepository.create(companyData);
    return this.companyRepository.save(company);
  }

  async update(id: string, companyData: Partial<Company>): Promise<Company> {
    await this.companyRepository.update(id, companyData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.companyRepository.delete(id);
  }
}

