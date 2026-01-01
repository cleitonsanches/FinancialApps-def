// EXEMPLO: Configuração para Azure Database
// Este arquivo mostra como ficará a configuração
// Não usar diretamente - será integrado ao database.config.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbType = this.configService.get<string>('DB_TYPE') || 'sqlite';
    
    // Se não especificado, usa SQLite (compatibilidade com instalação atual)
    if (!dbType || dbType === 'sqlite') {
      const databasePath = this.configService.get<string>('DATABASE_PATH') || join(process.cwd(), 'database.sqlite');
      return {
        type: 'sqlite',
        database: databasePath,
        entities: [join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
        synchronize: false,
        logging: this.configService.get<string>('NODE_ENV') === 'development',
      };
    }

    // Configuração para PostgreSQL (Azure Database for PostgreSQL)
    if (dbType === 'postgres') {
      return {
        type: 'postgres',
        host: this.configService.get<string>('DB_HOST'),
        port: parseInt(this.configService.get<string>('DB_PORT') || '5432'),
        username: this.configService.get<string>('DB_USERNAME'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_DATABASE'),
        entities: [join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
        synchronize: false, // NUNCA true em produção
        ssl: this.configService.get<string>('DB_SSL') === 'true' ? {
          rejectUnauthorized: false // Necessário para Azure
        } : false,
        logging: this.configService.get<string>('NODE_ENV') === 'development',
        extra: {
          ssl: {
            rejectUnauthorized: false
          }
        }
      };
    }

    // Configuração para SQL Server (Azure SQL Database)
    if (dbType === 'mssql') {
      return {
        type: 'mssql',
        host: this.configService.get<string>('DB_HOST'),
        port: parseInt(this.configService.get<string>('DB_PORT') || '1433'),
        username: this.configService.get<string>('DB_USERNAME'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_DATABASE'),
        entities: [join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
        synchronize: false,
        options: {
          encrypt: true, // Necessário para Azure
          trustServerCertificate: false,
        },
        logging: this.configService.get<string>('NODE_ENV') === 'development',
      };
    }

    // Configuração para MySQL (Azure Database for MySQL)
    if (dbType === 'mysql') {
      return {
        type: 'mysql',
        host: this.configService.get<string>('DB_HOST'),
        port: parseInt(this.configService.get<string>('DB_PORT') || '3306'),
        username: this.configService.get<string>('DB_USERNAME'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_DATABASE'),
        entities: [join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
        synchronize: false,
        ssl: this.configService.get<string>('DB_SSL') === 'true' ? {
          rejectUnauthorized: false
        } : false,
        logging: this.configService.get<string>('NODE_ENV') === 'development',
      };
    }

    throw new Error(`Tipo de banco não suportado: ${dbType}`);
  }
}



