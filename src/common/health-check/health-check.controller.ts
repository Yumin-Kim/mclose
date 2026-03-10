import { Controller, Get, Logger } from '@nestjs/common';

// default HealthCheckController
@Controller()
export class HealthCheckController {
  private readonly logger = new Logger(HealthCheckController.name);

  constructor() {}

  @Get('/ping')
  getPingPoing() {
    this.logger.log('ping');
    return 'pong';
  }

  @Get('/health_check')
  getHealthCheck() {
    this.logger.log('health_check');
    return 'ok';
  }
}
