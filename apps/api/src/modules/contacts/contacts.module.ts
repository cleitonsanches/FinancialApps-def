import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../../database/entities/contact.entity';
import { User } from '../../database/entities/user.entity';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, User])],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
