import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../database/entities/user.entity';
import { Contact } from '../../database/entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Contact])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

