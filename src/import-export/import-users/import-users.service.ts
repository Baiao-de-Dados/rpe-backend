import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class ImportUsersService {
    constructor(private readonly prisma: PrismaService) {}

    async importUsersFromExcel(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo foi enviado.');
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(file.buffer);

        const worksheet = workbook.getWorksheet(1); // Pega a primeira aba do Excel
        if (!worksheet) {
            throw new BadRequestException('A aba do Excel não foi encontrada.');
        }

        const users: {
            name: string;
            email: string;
            track: string;
            role: string;
            password: string;
        }[] = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Ignora o cabeçalho
            const values = Array.isArray(row.values) ? row.values : [];
            const [name, email, track, role, password] = values
                .slice(1)
                .map((value) => (typeof value === 'string' ? value.trim() : ''));

            // Converte o formato nome.sobrenome para Nome Sobrenome
            const formattedName = name
                .split('.')
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');

            users.push({ name: formattedName, email, track, role, password });
        });

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            let track = await this.prisma.track.findUnique({
                where: { name: user.track || 'Não informado' },
            });

            if (!track) {
                track = await this.prisma.track.create({
                    data: { name: user.track || 'Não informado' },
                });
            }
            await this.prisma.user.create({
                data: {
                    email: user.email,
                    password: hashedPassword,
                    name: user.name,
                    trackId: track.id,
                    userRoles: {
                        create: [{ role: user.role as UserRole }],
                    },
                },
            });
        }

        return `${users.length} usuários importados com sucesso.`;
    }
}
