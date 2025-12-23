import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() createContactDto: any, @Request() req: any) {
    console.log('POST /contacts - Recebida requisição');
    console.log('Body:', createContactDto);
    console.log('User:', req.user);
    
    const companyId = req.user?.companyId;
    if (!companyId) {
      console.error('Erro: companyId não encontrado no token');
      throw new BadRequestException('Usuário não possui empresa vinculada. Por favor, cadastre uma empresa primeiro.');
    }
    
    console.log('Criando contato com companyId:', companyId);
    return this.contactsService.create(createContactDto, companyId);
  }

  @Get()
  findAll(@Request() req: any, @Query('clientId') clientId?: string, @Query('excludeUsers') excludeUsers?: string) {
    const excludeUsersBool = excludeUsers === 'true';
    return this.contactsService.findAll(req.user?.companyId, clientId, excludeUsersBool);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.contactsService.findOne(id, req.user?.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContactDto: any, @Request() req: any) {
    return this.contactsService.update(id, updateContactDto, req.user?.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.contactsService.remove(id, req.user?.companyId);
  }
}
