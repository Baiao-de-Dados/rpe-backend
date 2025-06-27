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

@ApiTags('Pilares')
@ApiAuth()
@Controller('pillars')
export class PillarsController {
    constructor(private readonly pillarsService: PillarsService) {}

    @OnlyRH()
    @Post()
    @ApiCreate('pilar')
    create(@Body() createPillarDto: CreatePillarDto) {
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
    update(@Param('id', ParseIntPipe) id: number, @Body() updatePillarDto: UpdatePillarDto) {
        return this.pillarsService.update(id, updatePillarDto);
    }

    @OnlyRH()
    @Delete(':id')
    @ApiDelete('pilar')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.pillarsService.remove(id);
    }

    // Endpoints para configuração de pilares por trilha e cargo
    @OnlyRH()
    @Post('track-config')
    @ApiCreate('configuração de pilar por trilha/cargo')
    createTrackConfig(@Body() createConfigDto: CreatePillarTrackConfigDto) {
        return this.pillarsService.createTrackConfig(createConfigDto);
    }

    @OnlyRH()
    @Get('track-config/all')
    @ApiList('configurações de pilares por trilha/cargo')
    findAllTrackConfigs() {
        return this.pillarsService.findAllTrackConfigs();
    }

    @OnlyRH()
    @Get('track-config/filter')
    @ApiGet('configurações de pilares por trilha/cargo filtradas')
    findTrackConfigsByFilter(@Query('track') track?: string, @Query('position') position?: string) {
        return this.pillarsService.findTrackConfigsByTrackAndPosition(track, position);
    }

    @OnlyRH()
    @Get('track-config/user/:userId')
    @ApiGet('pilares ativos para usuário')
    findActivePillarsForUser(@Param('userId', ParseIntPipe) userId: number) {
        return this.pillarsService.findActivePillarsForUser(userId);
    }

    @OnlyRH()
    @Patch('track-config/:pillarId')
    @ApiUpdate('configuração de pilar por trilha/cargo')
    updateTrackConfig(
        @Param('pillarId', ParseIntPipe) pillarId: number,
        @Body() updateConfigDto: UpdatePillarTrackConfigDto,
        @Query('track') track?: string,
        @Query('position') position?: string,
    ) {
        return this.pillarsService.updateTrackConfig(
            pillarId,
            track || null,
            position || null,
            updateConfigDto,
        );
    }

    @OnlyRH()
    @Delete('track-config/:pillarId')
    @ApiDelete('configuração de pilar por trilha/cargo')
    removeTrackConfig(
        @Param('pillarId', ParseIntPipe) pillarId: number,
        @Query('track') track?: string,
        @Query('position') position?: string,
    ) {
        return this.pillarsService.removeTrackConfig(pillarId, track || null, position || null);
    }
}
