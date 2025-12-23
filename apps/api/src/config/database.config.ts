import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const databasePath = join(__dirname, '../../dev.db');
    
    return {
      type: 'sqlite',
      database: databasePath,
      entities: [
        join(__dirname, '../database/entities/user.entity{.ts,.js}'),
        join(__dirname, '../database/entities/company.entity{.ts,.js}'),
        join(__dirname, '../database/entities/client.entity{.ts,.js}'),
        join(__dirname, '../database/entities/contact.entity{.ts,.js}'),
        join(__dirname, '../database/entities/proposal.entity{.ts,.js}'),
        join(__dirname, '../database/entities/proposal-template.entity{.ts,.js}'),
        join(__dirname, '../database/entities/proposal-template-field.entity{.ts,.js}'),
        join(__dirname, '../database/entities/project-template.entity{.ts,.js}'),
        join(__dirname, '../database/entities/project-template-task.entity{.ts,.js}'),
        join(__dirname, '../database/entities/chart-of-accounts.entity{.ts,.js}'),
        join(__dirname, '../database/entities/bank-account.entity{.ts,.js}'),
      ],
      synchronize: false,
      logging: ['error'],
      autoLoadEntities: true,
    };
  }
}
