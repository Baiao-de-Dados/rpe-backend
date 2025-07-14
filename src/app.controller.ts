import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { getBrazilDate } from './cycles/utils';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Public()
    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Public()
    @Get('health')
    getHealth() {
        return { status: 'ok', timestamp: getBrazilDate().toISOString() };
    }
}
