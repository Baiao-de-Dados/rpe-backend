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

        // 1. Criar Mentor Dummy sem mentorId
        const encryptedEmailDummy = encrypt('dummy@teste.com');
        const dummyMentor = await this.prisma.user.create({
            data: {
                email: encryptedEmailDummy,
                password: hashedPassword,
                name: 'Dummy',
                position: 'Mentor',
                mentorId: null,
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
                userRoles: {
                    create: [
                        { role: 'RH' },
                        { role: 'EMPLOYER' },
                        { role: 'ADMIN' },
                        { role: 'MANAGER' },
                        { role: 'LEADER' },
                    ],
                },
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

        // Usuário Gestor
        const encryptedEmailManager = encrypt('manager@teste.com');
        const manager = await this.prisma.user.create({
            data: {
                email: encryptedEmailManager,
                password: hashedPassword,
                name: 'Carlos Gestor',
                position: 'Gerente de Projeto',
                mentorId: mentor.id,
                trackId: trackBackend.id,
                userRoles: {
                    create: [{ role: 'MANAGER' }],
                },
            },
        });

        // Usuário Líder 1
        const encryptedEmailLeader1 = encrypt('leader1@teste.com');
        const leader1 = await this.prisma.user.create({
            data: {
                email: encryptedEmailLeader1,
                password: hashedPassword,
                name: 'Pedro Líder',
                position: 'Tech Lead Backend',
                mentorId: mentor.id,
                trackId: trackBackend.id,
                userRoles: {
                    create: [{ role: 'LEADER' }],
                },
            },
        });

        // Usuário Líder 2
        const encryptedEmailLeader2 = encrypt('leader2@teste.com');
        const leader2 = await this.prisma.user.create({
            data: {
                email: encryptedEmailLeader2,
                password: hashedPassword,
                name: 'Sofia Líder',
                position: 'Tech Lead Frontend',
                mentorId: mentor.id,
                trackId: trackFrontend.id,
                userRoles: {
                    create: [{ role: 'LEADER' }],
                },
            },
        });

        // Usuário Comitê
        const encryptedEmailCommittee = encrypt('committee@teste.com');
        const committee = await this.prisma.user.create({
            data: {
                email: encryptedEmailCommittee,
                password: hashedPassword,
                name: 'Comitê de Avaliação',
                position: 'Membro do Comitê',
                mentorId: mentor.id,
                trackId: trackBackend.id,
                userRoles: {
                    create: [{ role: 'COMMITTEE' }],
                },
            },
        });

        // Usuário Backend
        const userBackend = await this.prisma.user.findUnique({
            where: { email: encryptedEmailBackend },
        });
        // Usuário Frontend
        const userFrontend = await this.prisma.user.findUnique({
            where: { email: encryptedEmailFrontend },
        });

        // Projeto
        const project = await this.prisma.project.create({
            data: {
                name: 'Sistema de Avaliações',
                description: 'Projeto para desenvolvimento do sistema de avaliações da RocketCorp',
                status: 'ACTIVE',
                managerId: manager.id,
            },
        });

        console.log('👥 Adicionando membros ao projeto...');

        // Adicionar membros ao projeto (gestor, líderes e desenvolvedores)
        const projectMembers = [
            { projectId: project.id, userId: manager.id }, // Gestor
            { projectId: project.id, userId: leader1.id }, // Líder 1
            { projectId: project.id, userId: leader2.id }, // Líder 2
            { projectId: project.id, userId: userBackend?.id }, // Dev Backend
            { projectId: project.id, userId: userFrontend?.id }, // Dev Frontend
        ]
            .filter((member) => typeof member.userId === 'number')
            .map((member) => ({ projectId: member.projectId, userId: member.userId as number }));

        await this.prisma.projectMember.createMany({
            data: projectMembers,
        });

        console.log('🔗 Criando assignments de líderes...');

        // Assignment de líderes ao projeto
        await this.prisma.leaderAssignment.createMany({
            data: [
                { projectId: project.id, leaderId: leader1.id },
                { projectId: project.id, leaderId: leader2.id },
            ],
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
                done: true,
            },
            {
                name: '2024.2',
                startDate: new Date('2024-07-01'),
                endDate: new Date('2024-12-31'),
                done: true,
            },
            {
                name: '2024.3',
                startDate: new Date('2024-09-01'),
                endDate: new Date('2024-11-30'),
                done: true,
            },
            {
                name: '2024.4',
                startDate: new Date('2024-10-01'),
                endDate: new Date('2024-12-15'),
                done: true,
            },
            {
                name: '2025.1',
                startDate: new Date('2025-01-01'),
                endDate: new Date('2025-06-30'),
                done: true,
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

        // Adicionar usuários para teste de AV360/referência
        await this.prisma.user.createMany({
            data: [
                {
                    email: 'isabel.oliveira@teste.com',
                    password: hashedPassword,
                    name: 'isabel.oliveira',
                    position: 'Tester',
                    mentorId: mentor.id,
                    trackId: trackBackend.id,
                },
                {
                    email: 'dr..raul@teste.com',
                    password: hashedPassword,
                    name: 'dr..raul',
                    position: 'Tester',
                    mentorId: mentor.id,
                    trackId: trackBackend.id,
                },
                {
                    email: 'isaac.oliveira@teste.com',
                    password: hashedPassword,
                    name: 'isaac.oliveira',
                    position: 'Tester',
                    mentorId: mentor.id,
                    trackId: trackBackend.id,
                },
                {
                    email: 'sra..esther@teste.com',
                    password: hashedPassword,
                    name: 'sra..esther',
                    position: 'Tester',
                    mentorId: mentor.id,
                    trackId: trackBackend.id,
                },
                {
                    email: 'alicia.ramos@teste.com',
                    password: hashedPassword,
                    name: 'alícia.ramos',
                    position: 'Tester',
                    mentorId: mentor.id,
                    trackId: trackBackend.id,
                },
            ],
            skipDuplicates: true,
        });

        return { message: 'Seed executada com sucesso!' };
    }
}
