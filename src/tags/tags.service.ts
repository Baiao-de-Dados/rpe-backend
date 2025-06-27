import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
    constructor(private prisma: PrismaService) {}

    async create(createTagDto: CreateTagDto) {
        return await this.prisma.tag.create({
            data: createTagDto,
        });
    }

    async findAll() {
        return await this.prisma.tag.findMany();
    }

    async findOne(id: number) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
        });

        if (!tag) {
            throw new NotFoundException(`Tag com ID ${id} não encontrada`);
        }

        return tag;
    }

    async update(id: number, updateTagDto: UpdateTagDto) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.tag.update({
            where: { id },
            data: updateTagDto,
        });
    }

    async remove(id: number) {
        await this.findOne(id); // Verifica se existe

        return this.prisma.tag.delete({
            where: { id },
        });
    }
}
