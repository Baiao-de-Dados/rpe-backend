import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { UpdatePillarDto } from './dto/update-pillar.dto';

@Injectable()
export class PillarsService {
    constructor(private prisma: PrismaService) {}

    async create(createPillarDto: CreatePillarDto) {
        return this.prisma.pillar.create({
            data: createPillarDto,
        });
    }

    async findAll() {
        return this.prisma.pillar.findMany({
            include: {
                criteria: true,
            },
        });
    }

    async findOne(id: number) {
        const pillar = await this.prisma.pillar.findUnique({
            where: { id },
            include: {
                criteria: true,
            },
        });

        if (!pillar) {
            throw new NotFoundException(`Pilar com ID ${id} não encontrado`);
        }

        return pillar;
    }

    async update(id: number, updatePillarDto: UpdatePillarDto) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.pillar.update({
            where: { id },
            data: updatePillarDto,
        });
    }

    async remove(id: number) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.pillar.delete({
            where: { id },
        });
    }
}
