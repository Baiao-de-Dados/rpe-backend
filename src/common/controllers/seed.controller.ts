import { Controller, Post } from '@nestjs/common';
import { SeedService } from '../services/seed.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('dev/seed')
export class SeedController {
    constructor(private readonly seedService: SeedService) {}

    @Public()
    @Post()
    async runSeed() {
        return this.seedService.runSeed();
    }

    @Public()
    @Post('evaluations-2025-2')
    async runEvaluationsSeed() {
        return this.seedService.runEvaluationsSeed();
    }
}
