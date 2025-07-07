import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePillarDto } from './dto/create-pillar.dto';
import { UpdatePillarDto } from './dto/update-pillar.dto';

@Injectable()
export class PillarsService {
    constructor(private prisma: PrismaService) {}

    async create(createPillarDto: CreatePillarDto) {
        // Verificar se já existe um pilar com o mesmo nome
        const existingPillar = await this.prisma.pillar.findFirst({
            where: {
                name: createPillarDto.name,
            },
        });

        if (existingPillar) {
            throw new BadRequestException(
                `Já existe um pilar com o nome "${createPillarDto.name}". Nomes de pilares devem ser únicos.`,
            );
        }

        return this.prisma.pillar.create({
            data: createPillarDto,
            include: {
                criteria: true,
            },
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

        // Se está atualizando o nome, verificar se já existe outro pilar com o mesmo nome
        if (updatePillarDto.name) {
            const existingPillar = await this.prisma.pillar.findFirst({
                where: {
                    name: updatePillarDto.name,
                    id: { not: id }, // Excluir o pilar atual da busca
                },
            });

            if (existingPillar) {
                throw new BadRequestException(
                    `Já existe um pilar com o nome "${updatePillarDto.name}". Nomes de pilares devem ser únicos.`,
                );
            }
        }

        return this.prisma.pillar.update({
            where: { id },
            data: updatePillarDto,
            include: {
                criteria: true,
            },
        });
    }

    async remove(id: number) {
        const pillar = await this.findOne(id); // Verifica se existe

        // Verificar se há critérios associados
        const criteriaCount = await this.prisma.criterion.count({
            where: { pillarId: id },
        });

        if (criteriaCount > 0) {
            throw new BadRequestException(
                `Não é possível remover o pilar "${pillar.name}" pois possui ${criteriaCount} critério(s) associado(s). Remova os critérios primeiro.`,
            );
        }

        return this.prisma.pillar.delete({
            where: { id },
        });
    }
}
