import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbType = this.configService.get<string>('DB_TYPE') || 'sqlite';
    
    // Se não especificado ou sqlite, usa SQLite (compatibilidade com instalação atual)
    if (!dbType || dbType === 'sqlite') {
      const databasePath = this.configService.get<string>('DATABASE_PATH') || join(process.cwd(), 'database.sqlite');
      console.log('📂 Database path:', databasePath);
      console.log('📂 process.cwd():', process.cwd());
      return {
        type: 'sqlite',
        database: databasePath,
        entities: [join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
        synchronize: false, // Usar migrations
        logging: this.configService.get<string>('NODE_ENV') === 'development',
      };
    }

    // Configuração para SQL Server (Azure SQL Database)
    if (dbType === 'mssql') {
      const config: TypeOrmModuleOptions = {
        type: 'mssql',
        host: this.configService.get<string>('DB_HOST'),
        port: parseInt(this.configService.get<string>('DB_PORT') || '1433'),
        username: this.configService.get<string>('DB_USERNAME'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_DATABASE'),
        entities: [join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
        synchronize: false, // NUNCA true em produção
        logging: this.configService.get<string>('NODE_ENV') === 'development',
        extra: {
          encrypt: true, // Necessário para Azure SQL Database
          trustServerCertificate: false, // Valida certificado SSL
        },
      };
      
      console.log('🗄️ Conectando ao SQL Server Azure:');
      console.log(`   Host: ${config.host}`);
      console.log(`   Port: ${config.port}`);
      console.log(`   Database: ${config.database}`);
      console.log(`   Username: ${config.username}`);
      
      return config;
    }

    // Configuração para PostgreSQL (Azure Database for PostgreSQL)
    if (dbType === 'postgres') {
      const config: TypeOrmModuleOptions = {
        type: 'postgres',
        host: this.configService.get<string>('DB_HOST'),
        port: parseInt(this.configService.get<string>('DB_PORT') || '5432'),
        username: this.configService.get<string>('DB_USERNAME'),
        password: this.configService.get<string>('DB_PASSWORD'),
        database: this.configService.get<string>('DB_DATABASE'),
        entities: [join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
        synchronize: false, // NUNCA true em produção
        logging: this.configService.get<string>('NODE_ENV') === 'development',
        ssl: {
          rejectUnauthorized: false, // Necessário para Azure
        },
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      };
      
      console.log('🐘 Conectando ao PostgreSQL Azure:');
      console.log(`   Host: ${config.host}`);
      console.log(`   Database: ${config.database}`);
      console.log(`   Username: ${config.username}`);
      
      return config;
    }

    throw new Error(`Tipo de banco não suportado: ${dbType}. Use 'sqlite', 'mssql' ou 'postgres'`);
  }
}

