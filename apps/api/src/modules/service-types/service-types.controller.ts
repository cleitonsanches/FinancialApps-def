import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ServiceTypesService } from './service-types.service';
import { ServiceType } from '../../database/entities/service-type.entity';

@Controller('service-types')
export class ServiceTypesController {
  constructor(private serviceTypesService: ServiceTypesService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Query('includeInactive') includeInactive?: string, @Request() req?: any): Promise<ServiceType[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    if (includeInactive === 'true') {
      return this.serviceTypesService.findAllIncludingInactive(effectiveCompanyId);
    }
    return this.serviceTypesService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ServiceType> {
    return this.serviceTypesService.findOne(id);
  }

  @Post()
  async create(@Body() serviceTypeData: Partial<ServiceType>, @Request() req?: any): Promise<ServiceType> {
    const companyId = req?.user?.companyId || serviceTypeData.companyId;
    if (companyId && !serviceTypeData.companyId) {
      serviceTypeData.companyId = companyId;
    }
    return this.serviceTypesService.create(serviceTypeData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() serviceTypeData: Partial<ServiceType>): Promise<ServiceType> {
    return this.serviceTypesService.update(id, serviceTypeData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.serviceTypesService.delete(id);
  }
}


