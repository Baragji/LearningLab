import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Hent velkomstbesked' })
  @ApiResponse({
    status: 200,
    description: 'Velkomstbesked',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @Get()
  async getHello(): Promise<{ message: string }> {
    return await this.appService.getHello();
  }
}
