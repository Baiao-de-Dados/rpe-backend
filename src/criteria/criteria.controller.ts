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
import { CriteriaService } from './criteria.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { CreateCriterionTrackConfigDto } from './dto/create-criterion-track-config.dto';
import { UpdateCriterionTrackConfigDto } from './dto/update-criterion-track-config.dto';
import { BatchUpdateCriteriaDto } from './dto/batch-update-criteria.dto';
import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
    ApiCreate,
    ApiUpdate,
    ApiGet,
    ApiList,
    ApiDelete,
} from 'src/common/decorators/api-crud.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { CycleConfigService } from '../cycle-config/cycle-config.service';

@ApiTags('Critérios')
@ApiAuth()
@Controller('criteria')
export class CriteriaController {
    constructor(
        private readonly criteriaService: CriteriaService,
        private readonly cycleConfigService: CycleConfigService,
    ) {}

    @Post()
    @ExactRoles(UserRole.RH)
    @ApiCreate('critério')
    async create(@Body() createCriterionDto: CreateCriterionDto) {
        // Validar se não há ciclo ativo antes de criar critérios
        await this.cycleConfigService.validateCycleNotActive();

        return this.criteriaService.create(createCriterionDto);
    }

    @Get()
    @ExactRoles(UserRole.RH)
    @ApiList('critérios')
    findAll() {
        return this.criteriaService.findAll();
    }

    @Get('pillar/:pillarId')
    @ExactRoles(UserRole.RH)
    @ApiGet('critérios por pilar')
    findByPillar(@Param('pillarId', ParseIntPipe) pillarId: number) {
        return this.criteriaService.findByPillar(pillarId);
    }

    @Get(':id')
    @ExactRoles(UserRole.RH)
    @ApiGet('critério')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.criteriaService.findOne(id);
    }

    @Patch()
    @ExactRoles(UserRole.RH)
    @ApiUpdate('critérios em lote')
    async batchUpdate(@Body() batchUpdateDto: BatchUpdateCriteriaDto) {
        // Validar se não há ciclo ativo antes de atualizar critérios
        await this.cycleConfigService.validateCycleNotActive();

        return this.criteriaService.batchUpdate(batchUpdateDto);
    }

    @Delete(':id')
    @ExactRoles(UserRole.RH)
    @ApiDelete('critério')
    async remove(@Param('id', ParseIntPipe) id: number) {
        // Validar se não há ciclo ativo antes de remover critérios
        await this.cycleConfigService.validateCycleNotActive();

        return this.criteriaService.remove(id);
    }

    // Endpoints para configuração de critérios por trilha e cargo
    @Post('track-config')
    @ExactRoles(UserRole.RH)
    @ApiCreate('configuração de critério por trilha/cargo')
    async createTrackConfig(@Body() createConfigDto: CreateCriterionTrackConfigDto) {
        // Validar se não há ciclo ativo antes de configurar critérios por trilha
        await this.cycleConfigService.validateCycleNotActive();

        return this.criteriaService.createTrackConfig(createConfigDto);
    }

    @Get('track-config/all')
    @ExactRoles(UserRole.RH)
    @ApiList('configurações de critérios por trilha/cargo')
    findAllTrackConfigs() {
        return this.criteriaService.findAllTrackConfigs();
    }

    @Get('track-config/filter')
    @ExactRoles(UserRole.RH)
    @ApiGet('configurações de critérios por trilha/cargo filtradas')
    findTrackConfigsByFilter(@Query('track') track?: string, @Query('position') position?: string) {
        return this.criteriaService.findTrackConfigsByTrackAndPosition(track, position);
    }

    @Get('track-config/user/:userId')
    @ExactRoles(UserRole.RH)
    @ApiGet('critérios ativos para usuário')
    findActiveCriteriaForUser(@Param('userId', ParseIntPipe) userId: number) {
        return this.criteriaService.findActiveCriteriaForUser(userId);
    }

    @Patch('track-config/:criterionId')
    @ExactRoles(UserRole.RH)
    @ApiUpdate('configuração de critério por trilha/cargo')
    async updateTrackConfig(
        @Param('criterionId', ParseIntPipe) criterionId: number,
        @Body() updateConfigDto: UpdateCriterionTrackConfigDto,
        @Query('track') track?: string,
        @Query('position') position?: string,
    ) {
        // Validar se não há ciclo ativo antes de atualizar configurações
        await this.cycleConfigService.validateCycleNotActive();

        return this.criteriaService.updateTrackConfig(
            criterionId,
            track || null,
            position || null,
            updateConfigDto,
        );
    }

    @Delete('track-config/:criterionId')
    @ExactRoles(UserRole.RH)
    @ApiDelete('configuração de critério por trilha/cargo')
    async removeTrackConfig(
        @Param('criterionId', ParseIntPipe) criterionId: number,
        @Query('track') track?: string,
        @Query('position') position?: string,
    ) {
        // Validar se não há ciclo ativo antes de remover configurações
        await this.cycleConfigService.validateCycleNotActive();

        return this.criteriaService.removeTrackConfig(criterionId, track || null, position || null);
    }
}
