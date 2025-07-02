import { Controller, Post } from '@nestjs/common';
import { SeedService } from '../services/seed.service';

@Controller('dev/seed')
export class SeedController {
    constructor(private readonly seedService: SeedService) {}

    @Post()
    async runSeed() {
        return this.seedService.runSeed();
    }
}
