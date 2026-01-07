import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: process.env.DB_DATABASE || 'not configured',
      port: process.env.PORT || 'not configured',
    };
  }
}

