import { Controller, Get, Post, Put, Delete, Body, Param, Query, Request } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Contact } from '../../database/entities/contact.entity';

@Controller('contacts')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<Contact[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.contactsService.findAll(effectiveCompanyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Contact> {
    return this.contactsService.findOne(id);
  }

  @Post()
  async create(@Body() contactData: Partial<Contact>, @Request() req?: any): Promise<Contact> {
    const companyId = req?.user?.companyId;
    if (companyId && !contactData.companyId) {
      contactData.companyId = companyId;
    }
    return this.contactsService.create(contactData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() contactData: Partial<Contact>): Promise<Contact> {
    return this.contactsService.update(id, contactData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.contactsService.delete(id);
  }
}

