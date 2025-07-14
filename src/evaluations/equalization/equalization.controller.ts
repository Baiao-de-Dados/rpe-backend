import { Controller, Post, Put, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequireAdmin, RequireCommittee } from '../../auth/decorators/roles.decorator';
import { EqualizationService } from './equalization.service';
import { SaveEqualizationDto } from './dto/save-equalization.dto';
import { ApiSaveEqualization, ApiEditEqualization } from './swagger/equalization.swagger';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';

@ApiAuth()
@ApiTags('Equalização')
@Controller('equalization')
export class EqualizationController {
    constructor(private readonly equalizationService: EqualizationService) {}

    @RequireAdmin()
    @Post()
    @ApiSaveEqualization()
    async saveEqualization(@Body() dto: SaveEqualizationDto) {
        if (!dto.cycleId || !dto.collaboratorId || dto.rating === undefined || !dto.justification) {
            throw new BadRequestException('cycleId, collaboratorId, rating, and justification are required.');
        }
        return this.equalizationService.saveEqualization(dto);
    }

    @RequireCommittee()
    @Put()
    @ApiEditEqualization()
    async editEqualization(@Body() dto: SaveEqualizationDto) {
        if (!dto.cycleId || !dto.collaboratorId || dto.rating === undefined || !dto.justification) {
            throw new BadRequestException('cycleId, collaboratorId, rating, and justification are required.');
        }
        return this.equalizationService.editEqualization(dto);
    }
}
