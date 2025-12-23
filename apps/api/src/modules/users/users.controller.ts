import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, BadRequestException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Request() req: any, @Query('onlyActive') onlyActive?: string) {
    const onlyActiveBool = onlyActive === 'true';
    return this.usersService.findAll(req.user?.companyId, onlyActiveBool);
  }

  @Post()
  create(@Body() createUserDto: any, @Request() req: any) {
    const companyId = req.user?.companyId;
    if (!companyId) {
      throw new BadRequestException('Usuário não possui empresa vinculada');
    }
    return this.usersService.create(createUserDto, companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user?.companyId;
    return this.usersService.findOne(id, companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: any, @Request() req: any) {
    const companyId = req.user?.companyId;
    return this.usersService.update(id, updateUserDto, companyId);
  }
}

