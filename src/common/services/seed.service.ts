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

        // 1. Criar Mentor Dummy
        const encryptedEmailDummy = encrypt('dummy@teste.com');
        const dummyMentor = await this.prisma.user.create({
            data: {
                email: encryptedEmailDummy,
                password: hashedPassword,
                name: 'Dummy',
                position: 'Mentor',
                mentorId: 1, // valor temporário, será ajustado depois
                trackId: trackBackend.id,
                userRoles: { create: [{ role: 'MENTOR' }] },
            },
        });

        // 2. Criar Mentor real, apontando para o dummy
        const encryptedEmailMentor = encrypt('mentor@teste.com');
        const mentor = await this.prisma.user.create({
            data: {
                email: encryptedEmailMentor,
                password: hashedPassword,
                name: 'Mentor Dummy',
                position: 'Mentor',
                mentorId: dummyMentor.id,
                trackId: trackBackend.id,
                userRoles: { create: [{ role: 'MENTOR' }] },
            },
        });

        // 3. Atualizar o dummy para apontar para o mentor real
        await this.prisma.user.update({
            where: { id: dummyMentor.id },
            data: { mentorId: mentor.id },
        });

        // 4. Agora sim, criar os demais usuários, referenciando o mentor real
        await this.prisma.user.upsert({
            where: { email: encryptedEmailBackend },
            update: {},
            create: {
                email: encryptedEmailBackend,
                password: hashedPassword,
                name: 'João Backend',
                position: 'DEV Backend',
                mentorId: mentor.id,
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
                position: 'DEV Frontend',
                mentorId: mentor.id,
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
                position: 'RH Tester',
                mentorId: mentor.id,
                trackId: trackRH.id,
                userRoles: { create: [{ role: 'RH' }, { role: 'EMPLOYER' }, { role: 'ADMIN' }] },
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
                position: 'Administrador',
                mentorId: mentor.id,
                trackId: trackBackend.id,
                userRoles: { create: [{ role: 'ADMIN' }] },
            },
        });

        // Pilares (usar upsert)
        const pilarComportamento = await this.prisma.pillar.upsert({
            where: { name: 'Comportamento' },
            update: {},
            create: { name: 'Comportamento' },
        });
        const pilarExecucao = await this.prisma.pillar.upsert({
            where: { name: 'Execução' },
            update: {},
            create: { name: 'Execução' },
        });
        const pilarGestao = await this.prisma.pillar.upsert({
            where: { name: 'Gestão e Liderança' },
            update: {},
            create: { name: 'Gestão e Liderança' },
        });

        // Critérios Comportamento
        const criteriosComportamento = [
            {
                name: 'Sentimento de Dono',
                description:
                    'Demonstra responsabilidade e senso de pertencimento nas tarefas e resultados.',
            },
            {
                name: 'Resiliencia nas adversidades',
                description: 'Mantém a calma e persevera diante de desafios e mudanças.',
            },
            {
                name: 'Organização no Trabalho',
                description: 'Organiza tarefas, prazos e prioridades de forma eficiente.',
            },
            {
                name: 'Capacidade de aprender',
                description: 'Busca aprendizado contínuo e aplica novos conhecimentos.',
            },
            {
                name: 'Ser "team player"',
                description: 'Colabora, compartilha e contribui para o sucesso do time.',
            },
        ];
        for (const criterio of criteriosComportamento) {
            await this.prisma.criterion.upsert({
                where: { name: criterio.name },
                update: {
                    description: criterio.description,
                    pillarId: pilarComportamento.id,
                },
                create: {
                    name: criterio.name,
                    description: criterio.description,
                    pillarId: pilarComportamento.id,
                },
            });
        }
        // Critérios Execução
        const criteriosExecucao = [
            {
                name: 'Entregar com qualidade',
                description: 'Produz trabalhos com excelência e atenção aos detalhes.',
            },
            {
                name: 'Atender aos prazos',
                description: 'Cumpre compromissos e entregas dentro dos prazos estabelecidos.',
            },
            {
                name: 'Fazer mais com menos',
                description: 'Otimiza recursos e processos para maximizar resultados.',
            },
            {
                name: 'Pensar fora da caixa',
                description: 'Proporciona soluções criativas e inovadoras para os desafios.',
            },
        ];
        for (const criterio of criteriosExecucao) {
            await this.prisma.criterion.upsert({
                where: { name: criterio.name },
                update: {
                    description: criterio.description,
                    pillarId: pilarExecucao.id,
                },
                create: {
                    name: criterio.name,
                    description: criterio.description,
                    pillarId: pilarExecucao.id,
                },
            });
        }
        // Critérios Gestão
        const criteriosGestao = [
            { name: 'Gente', description: 'Desenvolve e lidera pessoas de forma efetiva.' },
            {
                name: 'Resultados',
                description: 'Foca em entregar resultados consistentes e mensuráveis.',
            },
            {
                name: 'Evolução da Rocket Corp',
                description: 'Contribui para o crescimento e evolução da empresa.',
            },
        ];
        for (const criterio of criteriosGestao) {
            await this.prisma.criterion.upsert({
                where: { name: criterio.name },
                update: {
                    description: criterio.description,
                    pillarId: pilarGestao.id,
                },
                create: {
                    name: criterio.name,
                    description: criterio.description,
                    pillarId: pilarGestao.id,
                },
            });
        }

        // Buscar todos os critérios criados
        const allCriteria = await this.prisma.criterion.findMany();

        // Criar CriterionTrackConfig para todas as trilhas e critérios
        const tracks = [trackBackend, trackFrontend, trackRH];
        for (const track of tracks) {
            for (const criterion of allCriteria) {
                await this.prisma.criterionTrackConfig.upsert({
                    where: {
                        criterionId_trackId: {
                            criterionId: criterion.id,
                            trackId: track.id,
                        },
                    },
                    update: {},
                    create: {
                        criterionId: criterion.id,
                        trackId: track.id,
                        weight: 1,
                    },
                });
            }
        }

        // Criar 5 ciclos terminando em 2025.1
        const cycles = [
            {
                name: '2024.1',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-06-30'),
                isActive: false,
            },
            {
                name: '2024.2',
                startDate: new Date('2024-07-01'),
                endDate: new Date('2024-12-31'),
                isActive: false,
            },
            {
                name: '2024.3',
                startDate: new Date('2024-09-01'),
                endDate: new Date('2024-11-30'),
                isActive: false,
            },
            {
                name: '2024.4',
                startDate: new Date('2024-10-01'),
                endDate: new Date('2024-12-15'),
                isActive: false,
            },
            {
                name: '2025.1',
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-06-30'),
                isActive: false,
            },
        ];

        for (const cycleData of cycles) {
            const cycle = await this.prisma.cycleConfig.upsert({
                where: { name: cycleData.name },
                update: {},
                create: cycleData,
            });

            // Criar CriterionTrackCycleConfig para cada combinação de ciclo, trilha e critério
            for (const track of tracks) {
                for (const criterion of allCriteria) {
                    await this.prisma.criterionTrackCycleConfig.upsert({
                        where: {
                            cycleId_trackId_criterionId: {
                                cycleId: cycle.id,
                                trackId: track.id,
                                criterionId: criterion.id,
                            },
                        },
                        update: {},
                        create: {
                            cycleId: cycle.id,
                            trackId: track.id,
                            criterionId: criterion.id,
                            weight: 1,
                        },
                    });
                }
            }
        }

        return { message: 'Seed executada com sucesso!' };
    }
}
