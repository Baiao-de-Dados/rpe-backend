import { Controller, Post, Put, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RequireCommittee } from '../../auth/decorators/roles.decorator';
import { EqualizationService } from './equalization.service';
import { SaveEqualizationDto } from './dto/save-equalization.dto';

@ApiTags('Equalização')
@Controller('equalization')
export class EqualizationController {
    constructor(private readonly equalizationService: EqualizationService) {}

    @RequireCommittee()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Post()
    async saveEqualization(@Body() dto: SaveEqualizationDto) {
        if (!dto.cycleId || !dto.collaboratorId || dto.rating === undefined || !dto.justification) {
            throw new BadRequestException('cycleId, collaboratorId, rating, and justification are required.');
        }
        return this.equalizationService.saveEqualization(dto);
    }

    @RequireCommittee()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Put()
    async editEqualization(@Body() dto: SaveEqualizationDto) {
        if (!dto.cycleId || !dto.collaboratorId || dto.rating === undefined || !dto.justification) {
            throw new BadRequestException('cycleId, collaboratorId, rating, and justification are required.');
        }
        return this.equalizationService.editEqualization(dto);
    }
}
