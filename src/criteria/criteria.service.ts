import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';

@Injectable()
export class CriteriaService {
    constructor(private prisma: PrismaService) {}

    async create(createCriterionDto: CreateCriterionDto) {
        return this.prisma.criterion.create({
            data: createCriterionDto,
            include: {
                pillar: true,
            },
        });
    }

    async findAll() {
        return this.prisma.criterion.findMany({
            include: {
                pillar: true,
            },
        });
    }

    async findOne(id: number) {
        const criterion = await this.prisma.criterion.findUnique({
            where: { id },
            include: {
                pillar: true,
            },
        });

        if (!criterion) {
            throw new NotFoundException(`Critério com ID ${id} não encontrado`);
        }

        return criterion;
    }

    async update(id: number, updateCriterionDto: UpdateCriterionDto) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.criterion.update({
            where: { id },
            data: updateCriterionDto,
            include: {
                pillar: true,
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.criterion.delete({
            where: { id },
        });
    }

    async findByPillar(pillarId: number) {
        return this.prisma.criterion.findMany({
            where: { pillarId },
            include: {
                pillar: true,
            },
        });
    }
}
