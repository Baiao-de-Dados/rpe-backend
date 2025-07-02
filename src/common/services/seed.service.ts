import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class SeedService {
    constructor(private prisma: PrismaService) {}

    async runSeed() {
        const ALGORITHM = 'aes-256-cbc';
        const IV_LENGTH = 16;
        const SECRET = process.env.ENCRYPTION_KEY;
        if (!SECRET) {
            throw new Error('ENCRYPTION_KEY environment variable is not set');
        }
        const KEY = crypto.createHash('sha256').update(SECRET).digest();
        function encrypt(text: string): string {
            const iv = crypto.randomBytes(IV_LENGTH);
            const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + ':' + encrypted;
        }

        const hashedPassword = await bcrypt.hash('senha123', 10);
        const encryptedEmailBackend = encrypt('backend@teste.com');
        const encryptedEmailFrontend = encrypt('frontend@teste.com');
        const encryptedEmailRh = encrypt('rh@teste.com');

        // Trilhas (usar upsert)
        const trackBackend = await this.prisma.track.upsert({
            where: { name: 'Backend' },
            update: {},
            create: { name: 'Backend' },
        });
        const trackFrontend = await this.prisma.track.upsert({
            where: { name: 'Frontend' },
            update: {},
            create: { name: 'Frontend' },
        });
        const trackRH = await this.prisma.track.upsert({
            where: { name: 'RH' },
            update: {},
            create: { name: 'RH' },
        });
        const trackDefault = await this.prisma.track.upsert({
            where: { name: 'Default' },
            update: {},
            create: { name: 'Default' },
        });

        // Usuários normais (usar upsert)
        await this.prisma.user.upsert({
            where: { email: encryptedEmailBackend },
            update: {},
            create: {
                email: encryptedEmailBackend,
                password: hashedPassword,
                name: 'João Backend',
                trackId: trackBackend.id,
                userRoles: { create: [{ role: 'EMPLOYER' }] },
            },
        });
        await this.prisma.user.upsert({
            where: { email: encryptedEmailFrontend },
            update: {},
            create: {
                email: encryptedEmailFrontend,
                password: hashedPassword,
                name: 'Maria Frontend',
                trackId: trackFrontend.id,
                userRoles: { create: [{ role: 'EMPLOYER' }] },
            },
        });
        await this.prisma.user.upsert({
            where: { email: encryptedEmailRh },
            update: {},
            create: {
                email: encryptedEmailRh,
                password: hashedPassword,
                name: 'Ana RH',
                trackId: trackRH.id,
                userRoles: { create: [{ role: 'RH' }] },
            },
        });

        // Usuário admin (usar upsert)
        const encryptedEmailAdmin = encrypt('admin@test.com');
        await this.prisma.user.upsert({
            where: { email: encryptedEmailAdmin },
            update: {},
            create: {
                email: encryptedEmailAdmin,
                password: await bcrypt.hash('admin123', 10),
                name: 'System Admin',
                trackId: trackDefault.id,
                userRoles: { create: [{ role: 'ADMIN' }] },
            },
        });

        // Pilares (usar upsert)
        const pilarComportamento = await this.prisma.pillar.upsert({
            where: { name: 'COMPORTAMENTO' },
            update: {},
            create: { name: 'COMPORTAMENTO' },
        });
        const pilarExecucao = await this.prisma.pillar.upsert({
            where: { name: 'EXECUÇÃO' },
            update: {},
            create: { name: 'EXECUÇÃO' },
        });
        const pilarGestao = await this.prisma.pillar.upsert({
            where: { name: 'GESTÃO E LIDERANÇA' },
            update: {},
            create: { name: 'GESTÃO E LIDERANÇA' },
        });

        // Critérios Comportamento
        const criteriosComportamento = [
            {
                name: 'SENTIMENTO DE DONO',
                description:
                    'Demonstra responsabilidade e senso de pertencimento nas tarefas e resultados.',
            },
            {
                name: 'RESILIENCIA NAS ADVERSIDADES',
                description: 'Mantém a calma e persevera diante de desafios e mudanças.',
            },
            {
                name: 'ORGANIZAÇÃO NO TRABALHO',
                description: 'Organiza tarefas, prazos e prioridades de forma eficiente.',
            },
            {
                name: 'CAPACIDADE DE APRENDER',
                description: 'Busca aprendizado contínuo e aplica novos conhecimentos.',
            },
            {
                name: 'SER TEAM PLAYER',
                description: 'Colabora, compartilha e contribui para o sucesso do time.',
            },
        ];
        for (const criterio of criteriosComportamento) {
            await this.prisma.criterion.create({
                data: {
                    name: criterio.name,
                    description: criterio.description,
                    pillarId: pilarComportamento.id,
                },
            });
        }
        // Critérios Execução
        const criteriosExecucao = [
            {
                name: 'ENTREGAR COM QUALIDADE',
                description: 'Produz trabalhos com excelência e atenção aos detalhes.',
            },
            {
                name: 'ATENDER AOS PRAZOS',
                description: 'Cumpre compromissos e entregas dentro dos prazos estabelecidos.',
            },
            {
                name: 'FAZER MAIS COM MENOS',
                description: 'Otimiza recursos e processos para maximizar resultados.',
            },
            {
                name: 'PENSAR FORA DA CAIXA',
                description: 'Proporciona soluções criativas e inovadoras para os desafios.',
            },
        ];
        for (const criterio of criteriosExecucao) {
            await this.prisma.criterion.create({
                data: {
                    name: criterio.name,
                    description: criterio.description,
                    pillarId: pilarExecucao.id,
                },
            });
        }
        // Critérios Gestão
        const criteriosGestao = [
            { name: 'GENTE', description: 'Desenvolve e lidera pessoas de forma efetiva.' },
            {
                name: 'RESULTADOS',
                description: 'Foca em entregar resultados consistentes e mensuráveis.',
            },
            {
                name: 'EVOLUÇÃO DA ROCKET CORP',
                description: 'Contribui para o crescimento e evolução da empresa.',
            },
        ];
        for (const criterio of criteriosGestao) {
            await this.prisma.criterion.create({
                data: {
                    name: criterio.name,
                    description: criterio.description,
                    pillarId: pilarGestao.id,
                },
            });
        }
        return { message: 'Seed executada com sucesso!' };
    }
}
