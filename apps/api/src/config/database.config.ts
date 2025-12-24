import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
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
}

