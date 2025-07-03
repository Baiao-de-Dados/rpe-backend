import { PrismaService } from 'src/prisma/prisma.service';
import { RHUserDTO } from '../dto/rh.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UpdatePillarDto } from 'src/pillars/dto/update-pillar.dto';
import { CriteriaService } from 'src/criteria/criteria.service';
import { CycleConfigService } from 'src/cycle-config/cycle-config.service';
import { PillarsService } from 'src/pillars/pillars.service';
import { CreatePillarDto } from 'src/pillars/dto/create-pillar.dto';
import { CreateCriterionDto } from 'src/criteria/dto/create-criterion.dto';
import { UpdateCriterionDto } from 'src/criteria/dto/update-criterion.dto';
import { CreateCycleConfigDto } from 'src/cycle-config/dto/create-cycle-config.dto';
import { UpdateCycleConfigDto } from 'src/cycle-config/dto/update-cycle-config.dto';
import { CycleConfigResponseDto } from 'src/cycle-config/dto/cycle-config-response.dto';
import { CreatePillarTrackConfigDto } from 'src/pillars/dto/create-pillar-track-config.dto';
import { UpdatePillarTrackConfigDto } from 'src/pillars/dto/update-pillar-track-config.dto';
import { UpdateCriterionTrackConfigDto } from 'src/criteria/dto/update-criterion-track-config.dto';
import { BatchUpdateCriteriaDto } from 'src/criteria/dto/batch-update-criteria.dto';
import { TrackConfigDto } from 'src/criteria/dto/track-config.dto';

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

    async createPillarTrackConfig(dto: CreatePillarTrackConfigDto) {
        return this.pillarService.createTrackConfig(dto);
    }

    async findAllPillarTrackConfigs() {
        return this.pillarService.findAllTrackConfigs();
    }

    async findPillarTracksConfigByFilter(track: string) {
        return this.pillarService.findTrackConfigsByTrack(track);
    }

    async findActivePillarsForUser(userId: number) {
        return this.pillarService.findActivePillarsForUser(userId);
    }

    async updatePillarTrackConfig(
        pillarId: number,
        track: string,
        dto: UpdatePillarTrackConfigDto,
    ) {
        return this.pillarService.updateTrackConfig(pillarId, track, dto);
    }

    async removePillarTrackConfig(pillarId: number, track: string) {
        return this.pillarService.removeTrackConfig(pillarId, track);
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
        return this.criteriaService.findActiveCriteriaForUser(id);
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
        return this.criteriaService.batchUpdate(dto);
    }

    async createCriteriaTrackConfigBulk(trackConfigs: TrackConfigDto[]) {
        return this.criteriaService.createTrackConfigBulk(trackConfigs);
    }

    // Ciclos

    async validateCycleActive() {
        return this.cycleService.validateCycleNotActive();
    }

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
