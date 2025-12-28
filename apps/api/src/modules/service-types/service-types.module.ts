import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceType } from '../../database/entities/service-type.entity';
import { ServiceTypesService } from './service-types.service';
import { ServiceTypesController } from './service-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceType])],
  controllers: [ServiceTypesController],
  providers: [ServiceTypesService],
  exports: [ServiceTypesService],
})
export class ServiceTypesModule {}


