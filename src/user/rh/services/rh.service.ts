import { PrismaService } from 'src/prisma/prisma.service';
import { RHUserDTO } from '../dto/rh.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UpdatePillarDto } from 'src/evaluations/autoevaluations/pillar/dto/update-pillar.dto';
import { CycleConfigService } from 'src/evaluations/cycles/cycle-config.service';
import { PillarsService } from 'src/evaluations/autoevaluations/pillar/pillars.service';
import { CreatePillarDto } from 'src/evaluations/autoevaluations/pillar/dto/create-pillar.dto';
import { CreateCriterionDto } from 'src/evaluations/autoevaluations/criteria/dto/create-criterion.dto';
import { UpdateCriterionDto } from 'src/evaluations/autoevaluations/criteria/dto/update-criterion.dto';
import { UpdateCycleConfigDto } from 'src/evaluations/cycles/dto/update-cycle-config.dto';
import { BatchUpdateCriteriaDto } from 'src/evaluations/autoevaluations/criteria/dto/batch-update-criteria.dto';
import { TrackConfigDto } from 'src/evaluations/autoevaluations/criteria/dto/track-config.dto';
import { CreateCycleConfigDto } from 'src/evaluations/cycles/dto/create-cycle-config.dto';
import { CycleConfigResponseDto } from 'src/evaluations/cycles/dto/cycle-config-response.dto';
import { UpdateCriterionTrackConfigDto } from 'src/evaluations/autoevaluations/criteria/dto/update-criterion-track-config.dto';
import { CriteriaService } from 'src/evaluations/autoevaluations/criteria/criteria.service';

@Injectable()
export class RHService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly criteriaService: CriteriaService,
        private readonly cycleService: CycleConfigService,
        private readonly pillarService: PillarsService,
    ) {}

    async findAll(): Promise<RHUserDTO[]> {
        const users = await this.prisma.user.findMany({
            where: {
                userRoles: {
                    some: { role: UserRole.RH, isActive: true },
                },
            },
            include: {
                userRoles: true,
            },
        });

        return users.map((user) => ({
            id: user.id,
            name: user.name ?? '',
            email: user.email,
            role: UserRole.RH,
            isActive: user.userRoles.some((r) => r.role === UserRole.RH && r.isActive),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }));
    }

    async findOne(id: number): Promise<RHUserDTO> {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { userRoles: true },
        });

        if (!user || !user.userRoles.some((r) => r.role === UserRole.RH && r.isActive)) {
            throw new NotFoundException('Usuário RH não encontrado');
        }

        return {
            id: user.id,
            name: user.name ?? '',
            email: user.email,
            role: UserRole.RH,
            isActive: true,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    // Pilares
    async createPillar(createDto: CreatePillarDto) {
        return this.pillarService.create(createDto);
    }

    async findAllPillars() {
        return this.pillarService.findAll();
    }

    async findOnePillar(id: number) {
        return this.pillarService.findOne(id);
    }

    async updatePillar(id: number, updateDto: UpdatePillarDto) {
        return this.pillarService.update(id, updateDto);
    }

    async deletePillar(id: number) {
        return this.pillarService.remove(id);
    }
    // Critérios
    async createCriterion(dto: CreateCriterionDto) {
        return this.criteriaService.create(dto);
    }

    async findAllCriteria() {
        return this.criteriaService.findAll();
    }

    async findOneCriterion(id: number) {
        return this.criteriaService.findOne(id);
    }

    async updateCriterion(id: number, dto: UpdateCriterionDto) {
        return this.criteriaService.update(id, dto);
    }

    async deleteCriterion(id: number) {
        return this.criteriaService.remove(id);
    }

    async findCriterionByPillar(id: number) {
        return this.criteriaService.findByPillar(id);
    }

    async findAllCriteriaTracksConfigs() {
        return this.criteriaService.findAllTrackConfigs();
    }

    async findCriteriaTracksConfigsByTrack(id: number) {
        return this.criteriaService.findTrackConfigsByTrack(id);
    }

    async findActiveCriteriaPerUser(id: number) {
        const result = await this.criteriaService.findActiveCriteriaForUser(id);
        if (!result || Array.isArray(result)) {
            return { name: '', pillars: [] };
        }
        // Se vier no formato { id, name, pillars }, converte para { name, pillars }
        if ('id' in result && 'name' in result && 'pillars' in result) {
            return { name: result.name, pillars: result.pillars };
        }
        return result;
    }

    async updateCriteriaTrackConfig(
        criteriaId: number,
        trackId: number,
        dto: UpdateCriterionTrackConfigDto,
    ) {
        return await this.criteriaService.updateTrackConfig(criteriaId, trackId, dto);
    }

    async deleteCriteriaTrackConfig(criteriaId: number, trackId: number) {
        return await this.criteriaService.removeTrackConfig(criteriaId, trackId);
    }

    async batchUpdateCriteria(dto: BatchUpdateCriteriaDto) {
        return await this.criteriaService.batchUpdate(dto);
    }

    async createCriteriaTrackConfigBulk(trackConfigs: TrackConfigDto[]) {
        return await this.criteriaService.createTrackConfigBulk(trackConfigs);
    }

    // Ciclos

    async createCycle(dto: CreateCycleConfigDto): Promise<CycleConfigResponseDto> {
        return this.cycleService.create(dto);
    }

    async findActiveCycle(): Promise<CycleConfigResponseDto | null> {
        return this.cycleService.findActive();
    }

    async findAllCycles(): Promise<CycleConfigResponseDto[]> {
        return this.cycleService.findAll();
    }

    async findOneCycle(id: number): Promise<CycleConfigResponseDto> {
        return this.cycleService.findOne(id);
    }

    async updateCycle(id: number, dto: UpdateCycleConfigDto): Promise<CycleConfigResponseDto> {
        return this.cycleService.update(id, dto);
    }

    async deleteCycle(id: number) {
        return this.cycleService.remove(id);
    }
}
