import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'sqlite',
      database: this.configService.get<string>('DATABASE_PATH') || join(process.cwd(), 'database.sqlite'),
      entities: [join(__dirname, '../database/entities/**/*.entity{.ts,.js}')],
      synchronize: false, // Usar migrations
      logging: this.configService.get<string>('NODE_ENV') === 'development',
    };
  }
}

