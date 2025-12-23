import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from '../../database/entities/company.entity';

@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  async findAll(): Promise<Company[]> {
    return this.companyService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Company> {
    return this.companyService.findOne(id);
  }

  @Post()
  async create(@Body() companyData: Partial<Company>): Promise<Company> {
    return this.companyService.create(companyData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() companyData: Partial<Company>): Promise<Company> {
    return this.companyService.update(id, companyData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.companyService.delete(id);
  }
}

