import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
    constructor(private prisma: PrismaService) {}

    async upsertNote(userId: number, notes: string) {
        const id = Number(userId);
        return await this.prisma.notes.upsert({
            where: { userId: id },
            update: { notes },
            create: { userId: id, notes },
        });
    }

    async getNoteByUserId(
        userId: number | string,
    ): Promise<{ notes: string; updatedAt: Date | null }> {
        const note = await this.prisma.notes.findUnique({
            where: { userId: Number(userId) },
        });
        return {
            notes: note?.notes || '',
            updatedAt: note?.updatedAt || null,
        };
    }
}
