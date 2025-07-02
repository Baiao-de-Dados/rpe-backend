import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PillarsService } from './pillars.service';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { UpdatePillarDto } from './dto/update-pillar.dto';
import { CreatePillarTrackConfigDto } from './dto/create-pillar-track-config.dto';
import { UpdatePillarTrackConfigDto } from './dto/update-pillar-track-config.dto';
import {
    ApiCreate,
    ApiDelete,
    ApiGet,
    ApiUpdate,
    ApiList,
} from 'src/common/decorators/api-crud.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { OnlyRH } from 'src/auth/decorators/roles.decorator';
import { CycleConfigService } from '../cycle-config/cycle-config.service';

@ApiTags('Pilares')
@ApiAuth()
@Controller('pillars')
export class PillarsController {
    constructor(
        private readonly pillarsService: PillarsService,
        private readonly cycleConfigService: CycleConfigService,
    ) {}

    @OnlyRH()
    @Post()
    @ApiCreate('pilar')
    async create(@Body() createPillarDto: CreatePillarDto) {
        // Validar se não há ciclo ativo antes de criar pilares
        await this.cycleConfigService.validateCycleNotActive();

        return this.pillarsService.create(createPillarDto);
    }

    @OnlyRH()
    @Get()
    @ApiGet('pilares')
    findAll() {
        return this.pillarsService.findAll();
    }

    @OnlyRH()
    @Get(':id')
    @ApiGet('pilar')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pillarsService.findOne(id);
    }

    @OnlyRH()
    @Patch(':id')
    @ApiUpdate('pilar')
    async update(@Param('id', ParseIntPipe) id: number, @Body() updatePillarDto: UpdatePillarDto) {
        // Validar se não há ciclo ativo antes de atualizar pilares
        await this.cycleConfigService.validateCycleNotActive();

        return this.pillarsService.update(id, updatePillarDto);
    }

    @OnlyRH()
    @Delete(':id')
    @ApiDelete('pilar')
    async remove(@Param('id', ParseIntPipe) id: number) {
        // Validar se não há ciclo ativo antes de remover pilares
        await this.cycleConfigService.validateCycleNotActive();

        return this.pillarsService.remove(id);
    }

    // Endpoints para configuração de pilares por trilha
    @OnlyRH()
    @Post('track-config')
    @ApiCreate('configuração de pilar por trilha')
    async createTrackConfig(@Body() createConfigDto: CreatePillarTrackConfigDto) {
        // Validar se não há ciclo ativo antes de configurar pilares por trilha
        await this.cycleConfigService.validateCycleNotActive();

        return this.pillarsService.createTrackConfig(createConfigDto);
    }

    @OnlyRH()
    @Get('track-config/all')
    @ApiList('configurações de pilares por trilha')
    findAllTrackConfigs() {
        return this.pillarsService.findAllTrackConfigs();
    }

    @OnlyRH()
    @Get('track-config/filter')
    @ApiGet('configurações de pilares por trilha filtradas')
    findTrackConfigsByFilter(@Query('track') track: string) {
        return this.pillarsService.findTrackConfigsByTrack(track);
    }

    @OnlyRH()
    @Get('track-config/user/:userId')
    @ApiGet('pilares ativos para usuário')
    findActivePillarsForUser(@Param('userId', ParseIntPipe) userId: number) {
        return this.pillarsService.findActivePillarsForUser(userId);
    }

    @OnlyRH()
    @Patch('track-config/:pillarId')
    @ApiUpdate('configuração de pilar por trilha')
    async updateTrackConfig(
        @Param('pillarId', ParseIntPipe) pillarId: number,
        @Body() updateConfigDto: UpdatePillarTrackConfigDto,
        @Query('track') track: string,
    ) {
        // Validar se não há ciclo ativo antes de atualizar configurações
        await this.cycleConfigService.validateCycleNotActive();

        return this.pillarsService.updateTrackConfig(pillarId, track, updateConfigDto);
    }

    @OnlyRH()
    @Delete('track-config/:pillarId')
    @ApiDelete('configuração de pilar por trilha')
    async removeTrackConfig(
        @Param('pillarId', ParseIntPipe) pillarId: number,
        @Query('track') track: string,
    ) {
        // Validar se não há ciclo ativo antes de remover configurações
        await this.cycleConfigService.validateCycleNotActive();

        return this.pillarsService.removeTrackConfig(pillarId, track);
    }
}
