import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../cryptography/encryption.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class SeedService {
    constructor(
        private prisma: PrismaService,
        private encryptionService: EncryptionService,
    ) {}

    async runSeed() {
        const hashedPassword = await bcrypt.hash('senha123', 10);
        const encryptedEmailBackend = this.encryptionService.encrypt('backend@teste.com');
        const encryptedEmailFrontend = this.encryptionService.encrypt('frontend@teste.com');
        const encryptedEmailRh = this.encryptionService.encrypt('rh@teste.com');

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
        const trackBusiness = await this.prisma.track.upsert({
            where: { name: 'Business' },
            update: {},
            create: { name: 'Business' },
        });
        const trackManagement = await this.prisma.track.upsert({
            where: { name: 'Management' },
            update: {},
            create: { name: 'Management' },
        });
        const trackLeadership = await this.prisma.track.upsert({
            where: { name: 'Leadership' },
            update: {},
            create: { name: 'Leadership' },
        });
        const trackArchitecture = await this.prisma.track.upsert({
            where: { name: 'Architecture' },
            update: {},
            create: { name: 'Architecture' },
        });
        const trackDesign = await this.prisma.track.upsert({
            where: { name: 'Design' },
            update: {},
            create: { name: 'Design' },
        });
        const trackDevelopment = await this.prisma.track.upsert({
            where: { name: 'Development' },
            update: {},
            create: { name: 'Development' },
        });
        const trackDefault = await this.prisma.track.upsert({
            where: { name: 'Default' },
            update: {},
            create: { name: 'Default' },
        });

        // 1. Criar Mentor Dummy sem mentorId
        const encryptedEmailDummy = this.encryptionService.encrypt('dummy@teste.com');
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
        const encryptedEmailMentor = this.encryptionService.encrypt('mentor@teste.com');
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
        const encryptedEmailAdmin = this.encryptionService.encrypt('admin@teste.com');
        await this.prisma.user.upsert({
            where: { email: encryptedEmailAdmin },
            update: {},
            create: {
                email: encryptedEmailAdmin,
                password: await bcrypt.hash('senha123', 10),
                name: 'System Admin',
                position: 'Administrador',
                mentorId: mentor.id,
                trackId: trackBackend.id,
                userRoles: { create: [{ role: 'ADMIN' }] },
            },
        });

        // Usuário Gestor
        const encryptedEmailManager = this.encryptionService.encrypt('manager@teste.com');
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
        const encryptedEmailLeader1 = this.encryptionService.encrypt('leader1@teste.com');
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
        const encryptedEmailLeader2 = this.encryptionService.encrypt('leader2@teste.com');
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
        const encryptedEmailCommittee = this.encryptionService.encrypt('committee@teste.com');
        await this.prisma.user.create({
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

        // ...

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

        // ...

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
        const tracks = [
            trackBackend,
            trackFrontend,
            trackRH,
            trackBusiness,
            trackManagement,
            trackLeadership,
            trackArchitecture,
            trackDesign,
            trackDevelopment,
            trackDefault,
        ];
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
                name: '2023.1',
                startDate: new Date('2023-01-01'),
                endDate: new Date('2024-06-30'),
                done: true,
            },
            {
                name: '2023.2',
                startDate: new Date('2023-07-01'),
                endDate: new Date('2023-12-31'),
                done: true,
            },
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

        // Adicionar usuários para teste de AV360/referência (com emails criptografados)
        const testUsers = [
            {
                email: this.encryptionService.encrypt('isabel.oliveira@teste.com'),
                password: hashedPassword,
                name: 'isabel.oliveira',
                position: 'Tester',
                mentorId: mentor.id,
                trackId: trackBackend.id,
            },
            {
                email: this.encryptionService.encrypt('dr.raul@teste.com'),
                password: hashedPassword,
                name: 'dr.raul',
                position: 'Tester',
                mentorId: mentor.id,
                trackId: trackBackend.id,
            },
            {
                email: this.encryptionService.encrypt('isaac.oliveira@teste.com'),
                password: hashedPassword,
                name: 'isaac.oliveira',
                position: 'Tester',
                mentorId: mentor.id,
                trackId: trackBackend.id,
            },
            {
                email: this.encryptionService.encrypt('sra.esther@teste.com'),
                password: hashedPassword,
                name: 'sra.esther',
                position: 'Tester',
                mentorId: mentor.id,
                trackId: trackBackend.id,
            },
            {
                email: this.encryptionService.encrypt('alicia.ramos@teste.com'),
                password: hashedPassword,
                name: 'alícia.ramos',
                position: 'Tester',
                mentorId: mentor.id,
                trackId: trackBackend.id,
            },
        ];

        await this.prisma.user.createMany({
            data: testUsers,
            skipDuplicates: true,
        });

        // ================== GERAR AVALIAÇÕES PARA JOÃO BACKEND E MARIA FRONTEND EM TODOS OS CICLOS ==================
        // Buscar novamente os usuários, gestor, mentor e comitê
        const joao = await this.prisma.user.findUnique({ where: { email: encryptedEmailBackend } });
        const maria = await this.prisma.user.findUnique({
            where: { email: encryptedEmailFrontend },
        });
        if (!joao || !maria) {
            throw new Error('Usuários João Backend ou Maria Frontend não encontrados no banco.');
        }
        const gestor = manager;
        const mentorReal = mentor;
        const comite = await this.prisma.user.findUnique({
            where: { email: encryptedEmailCommittee },
        });
        if (!comite) {
            throw new Error('Usuário Comitê não encontrado no banco.');
        }

        // Buscar todos os ciclos
        const ciclos = await this.prisma.cycleConfig.findMany({
            where: { name: { in: ['2023.1', '2023.2', '2024.1', '2024.2', '2025.1'] } },
        });
        // Buscar todos os critérios
        const criterios = await this.prisma.criterion.findMany();

        // Perfis de score variados para os ciclos
        const cicloScores = [4.8, 0.7, 3.5, 4.2, 3.0]; // alta, extremamente baixa, média, alta, média-baixa
        const cicloJustificativas = [
            'Excelente desempenho.',
            'Precisa melhorar bastante.',
            'Desempenho regular, pode evoluir.',
            'Bom desempenho, acima da média.',
            'Desempenho abaixo do esperado.',
        ];

        for (let i = 0; i < ciclos.length; i++) {
            const ciclo = ciclos[i];
            const score = cicloScores[i % cicloScores.length];
            const justification = cicloJustificativas[i % cicloJustificativas.length];
            // --- EVALUATION ÚNICO POR USUÁRIO/CICLO ---
            // João
            let evaluationJoao = await this.prisma.evaluation.findUnique({
                where: {
                    evaluatorId_cycleConfigId: {
                        evaluatorId: joao.id,
                        cycleConfigId: ciclo.id,
                    },
                },
            });
            if (!evaluationJoao) {
                evaluationJoao = await this.prisma.evaluation.create({
                    data: {
                        evaluatorId: joao.id,
                        cycleConfigId: ciclo.id,
                        trackId: joao.trackId,
                    },
                });
            }
            // Maria
            let evaluationMaria = await this.prisma.evaluation.findUnique({
                where: {
                    evaluatorId_cycleConfigId: {
                        evaluatorId: maria.id,
                        cycleConfigId: ciclo.id,
                    },
                },
            });
            if (!evaluationMaria) {
                evaluationMaria = await this.prisma.evaluation.create({
                    data: {
                        evaluatorId: maria.id,
                        cycleConfigId: ciclo.id,
                        trackId: maria.trackId,
                    },
                });
            }

            // --- AUTOAVALIAÇÃO ---
            for (const evaluation of [evaluationJoao, evaluationMaria]) {
                // Score e justification variando por ciclo
                await this.prisma.autoEvaluation.upsert({
                    where: { evaluationId: evaluation.id },
                    update: { rating: score },
                    create: { evaluationId: evaluation.id, rating: score },
                });
                for (const criterio of criterios) {
                    await this.prisma.autoEvaluationAssignment.upsert({
                        where: {
                            evaluationId_criterionId: {
                                evaluationId: evaluation.id,
                                criterionId: criterio.id,
                            },
                        },
                        update: {
                            score: score,
                            justification: justification,
                        },
                        create: {
                            evaluationId: evaluation.id,
                            criterionId: criterio.id,
                            score: score,
                            justification: justification,
                        },
                    });
                }
            }

            // --- AVALIAÇÃO 360 (um avaliando o outro) ---
            await this.prisma.evaluation360.upsert({
                where: {
                    evaluationId_evaluatedId: {
                        evaluationId: evaluationJoao.id,
                        evaluatedId: maria.id,
                    },
                },
                update: {
                    score: score,
                    strengths: justification,
                    improvements: 'Buscar mais feedbacks.',
                },
                create: {
                    evaluationId: evaluationJoao.id,
                    evaluatedId: maria.id,
                    score: score,
                    strengths: justification,
                    improvements: 'Buscar mais feedbacks.',
                },
            });
            await this.prisma.evaluation360.upsert({
                where: {
                    evaluationId_evaluatedId: {
                        evaluationId: evaluationMaria.id,
                        evaluatedId: joao.id,
                    },
                },
                update: {
                    score: score,
                    strengths: justification,
                    improvements: 'Buscar mais feedbacks.',
                },
                create: {
                    evaluationId: evaluationMaria.id,
                    evaluatedId: joao.id,
                    score: score,
                    strengths: justification,
                    improvements: 'Buscar mais feedbacks.',
                },
            });

            // --- MENTORING ---
            await this.prisma.mentoring.upsert({
                where: { evaluationId: evaluationJoao.id },
                update: {
                    mentorId: mentorReal.id,
                    justification: justification,
                    score: score,
                },
                create: {
                    evaluationId: evaluationJoao.id,
                    mentorId: mentorReal.id,
                    justification: justification,
                    score: score,
                },
            });
            await this.prisma.mentoring.upsert({
                where: { evaluationId: evaluationMaria.id },
                update: {
                    mentorId: mentorReal.id,
                    justification: justification,
                    score: score,
                },
                create: {
                    evaluationId: evaluationMaria.id,
                    mentorId: mentorReal.id,
                    justification: justification,
                    score: score,
                },
            });

            // --- REFERÊNCIAS ---
            await this.prisma.reference.upsert({
                where: {
                    evaluationId_collaboratorId: {
                        evaluationId: evaluationJoao.id,
                        collaboratorId: maria.id,
                    },
                },
                update: { justification: justification },
                create: {
                    evaluationId: evaluationJoao.id,
                    collaboratorId: maria.id,
                    justification: justification,
                },
            });
            await this.prisma.reference.upsert({
                where: {
                    evaluationId_collaboratorId: {
                        evaluationId: evaluationMaria.id,
                        collaboratorId: joao.id,
                    },
                },
                update: { justification: justification },
                create: {
                    evaluationId: evaluationMaria.id,
                    collaboratorId: joao.id,
                    justification: justification,
                },
            });

            // --- NOTA DO GESTOR ---
            for (const user of [joao, maria]) {
                const managerEval = await this.prisma.managerEvaluation.create({
                    data: {
                        cycleId: ciclo.id,
                        managerId: gestor.id,
                        collaboratorId: user.id,
                    },
                });
                await this.prisma.managerEvaluationCriteria.create({
                    data: {
                        managerEvaluationId: managerEval.id,
                        criteriaId: criterios[0].id,
                        score: score,
                        justification: justification,
                    },
                });
            }

            // --- NOTA DO COMITÊ DE EQUALIZAÇÃO ---
            for (const user of [joao, maria]) {
                await this.prisma.equalization.create({
                    data: {
                        collaboratorId: user.id,
                        cycleId: ciclo.id,
                        committeeId: comite.id,
                        justification: justification,
                        score: score,
                    },
                });
            }
        }

        return { message: 'Seed executada com sucesso!' };
    }

    async runEvaluationsSeed() {
        console.log('Iniciando seed de avaliações para ciclo 2025.2...');

        // 1. Buscar ou criar ciclo 2025.2
        let cycle = await this.prisma.cycleConfig.findFirst({
            where: { name: '2025.2' },
        });
        if (!cycle) {
            cycle = await this.prisma.cycleConfig.create({
                data: {
                    name: '2025.2',
                    description: 'Ciclo de avaliações 2025.2',
                    startDate: new Date('2025-07-01'),
                    endDate: new Date('2025-12-31'),
                    done: false,
                },
            });
            console.log('Ciclo 2025.2 criado com ID:', cycle.id);
        } else {
            console.log('Ciclo 2025.2 encontrado com ID:', cycle.id);
        }

        // 2. Buscar usuários EMPLOYER ativos que são membros de projeto (ERP)
        const projectMembers = await this.prisma.projectMember.findMany({
            include: {
                user: {
                    include: {
                        userRoles: true,
                        track: true,
                    },
                },
            },
        });
        const erpUsers = projectMembers
            .map((pm) => pm.user)
            .filter((user) =>
                user.userRoles.some((ur) => ur.role === UserRole.EMPLOYER && ur.isActive),
            );

        console.log(`Encontrados ${erpUsers.length} usuários EMPLOYER membros de projeto`);

        // 3. Buscar critérios ativos por trilha/ciclo
        let allTrackCycleCriteria = await this.prisma.criterionTrackCycleConfig.findMany({
            where: { cycleId: cycle.id },
            include: { criterion: true, track: true },
        });

        console.log(
            `Encontrados ${allTrackCycleCriteria.length} critérios para o ciclo ${cycle.id}`,
        );

        // Se não existem critérios para o ciclo, criar os padrões
        if (allTrackCycleCriteria.length === 0) {
            console.log('Criando critérios padrão para o ciclo 2025.2...');

            // Buscar todos os critérios existentes
            const allCriteria = await this.prisma.criterion.findMany();

            // Buscar todas as trilhas
            const allTracks = await this.prisma.track.findMany();

            // Criar CriterionTrackCycleConfig para cada combinação de trilha e critério
            for (const track of allTracks) {
                for (const criterion of allCriteria) {
                    await this.prisma.criterionTrackCycleConfig.create({
                        data: {
                            cycleId: cycle.id,
                            trackId: track.id,
                            criterionId: criterion.id,
                            weight: 1, // Peso padrão
                        },
                    });
                }
            }

            console.log(
                `Criados ${allCriteria.length * allTracks.length} critérios para o ciclo ${cycle.id}`,
            );

            // Buscar novamente os critérios criados
            allTrackCycleCriteria = await this.prisma.criterionTrackCycleConfig.findMany({
                where: { cycleId: cycle.id },
                include: { criterion: true, track: true },
            });

            console.log(
                `Agora temos ${allTrackCycleCriteria.length} critérios para o ciclo ${cycle.id}`,
            );
        }

        // 4. Buscar avaliadores (manager, líder e comitê)
        const manager = await this.prisma.user.findFirst({
            where: { userRoles: { some: { role: UserRole.MANAGER, isActive: true } } },
        });
        const leader = await this.prisma.user.findFirst({
            where: { userRoles: { some: { role: UserRole.LEADER, isActive: true } } },
        });
        const committee = await this.prisma.user.findFirst({
            where: { userRoles: { some: { role: UserRole.COMMITTEE, isActive: true } } },
        });
        if (!manager || !leader || !committee) {
            throw new Error('Precisa de pelo menos um manager, líder e comitê cadastrados!');
        }

        console.log(
            `Avaliadores encontrados - Manager: ${manager.name}, Leader: ${leader.name}, Committee: ${committee.name}`,
        );

        // 5. Selecionar usuários específicos por role
        const employers = erpUsers.filter((user) =>
            user.userRoles.some((ur) => ur.role === UserRole.EMPLOYER && ur.isActive),
        );
        const leaders = await this.prisma.user.findMany({
            where: { userRoles: { some: { role: UserRole.LEADER, isActive: true } } },
            include: { userRoles: true, track: true },
        });
        const managers = await this.prisma.user.findMany({
            where: { userRoles: { some: { role: UserRole.MANAGER, isActive: true } } },
            include: { userRoles: true, track: true },
        });
        const committees = await this.prisma.user.findMany({
            where: { userRoles: { some: { role: UserRole.COMMITTEE, isActive: true } } },
            include: { userRoles: true, track: true },
        });

        // Selecionar quantidade específica de cada role
        const selectedEmployers = employers.slice(0, 4);
        const selectedLeaders = leaders.slice(0, 2);
        const selectedManagers = managers.slice(0, 2);
        const selectedCommittees = committees.slice(0, 2);

        const usersToSeed = [
            ...selectedEmployers,
            ...selectedLeaders,
            ...selectedManagers,
            ...selectedCommittees,
        ];

        console.log(`Total de usuários para seed: ${usersToSeed.length}`);
        console.log(`- EMPLOYER: ${selectedEmployers.length}`);
        console.log(`- LEADER: ${selectedLeaders.length}`);
        console.log(`- MANAGER: ${selectedManagers.length}`);
        console.log(`- COMMITTEE: ${selectedCommittees.length}`);

        let createdCount = 0;

        // 6. Para cada usuário, criar avaliações baseadas no role
        const scoreProfiles = [
            { score: 2.0, justification: 'Precisa melhorar bastante.' }, // baixa
            { score: 3.0, justification: 'Desempenho regular, pode evoluir.' }, // média-baixa
            { score: 3.5, justification: 'Desempenho consistente.' }, // média
            { score: 4.0, justification: 'Bom desempenho, acima da média.' }, // média-alta
            { score: 4.5, justification: 'Ótimo resultado, quase excelente.' }, // alta
            { score: 5.0, justification: 'Excelente, superou todas as expectativas!' }, // máxima
        ];
        let userIdx = 0;
        for (const user of usersToSeed) {
            // Verificar se já existe avaliação para este usuário no ciclo
            const existingEvaluation = await this.prisma.evaluation.findFirst({
                where: {
                    evaluatorId: user.id,
                    cycleConfigId: cycle.id,
                },
            });

            if (existingEvaluation) {
                console.log(`Pulando ${user.name} - já possui avaliação no ciclo ${cycle.name}`);
                continue;
            }

            const userRole = user.userRoles.find((ur) => ur.isActive)?.role;
            const userTrackId = user.trackId;
            const userCriteria = allTrackCycleCriteria.filter((c) => c.trackId === userTrackId);

            // Escolher perfil de score para este usuário
            const profile = scoreProfiles[userIdx % scoreProfiles.length];
            userIdx++;

            console.log(
                `Criando avaliações para ${user.name} (${userRole}) - Score base: ${profile.score}`,
            );

            // 1. Criar Evaluation
            const evaluation = await this.prisma.evaluation.create({
                data: {
                    evaluatorId: user.id,
                    cycleConfigId: cycle.id,
                    trackId: userTrackId,
                },
            });

            // 2. Criar AutoEvaluation
            await this.prisma.autoEvaluation.create({
                data: {
                    evaluationId: evaluation.id,
                },
            });

            // 3. Criar AutoEvaluationAssignment para cada critério
            let totalScore = 0;
            let totalWeight = 0;
            let critIdx = 0;
            for (const c of userCriteria) {
                // Alternar score por critério para dar mais variedade
                const critProfile = scoreProfiles[(userIdx + critIdx) % scoreProfiles.length];
                await this.prisma.autoEvaluationAssignment.create({
                    data: {
                        evaluationId: evaluation.id,
                        criterionId: c.criterionId,
                        score: critProfile.score,
                        justification: critProfile.justification,
                    },
                });
                const weight = c.weight || 1;
                totalScore += critProfile.score * weight;
                totalWeight += weight;
                critIdx++;
            }
            // Atualizar o rating da AutoEvaluation
            const rating = totalWeight > 0 ? totalScore / totalWeight : 0;
            await this.prisma.autoEvaluation.update({
                where: { evaluationId: evaluation.id },
                data: { rating },
            });

            // 4. Criar Evaluation360 (auto 360, só para seed)
            const eval360Profile = scoreProfiles[(userIdx + 1) % scoreProfiles.length];
            await this.prisma.evaluation360.create({
                data: {
                    evaluationId: evaluation.id,
                    evaluatedId: user.id,
                    score: eval360Profile.score,
                    strengths: eval360Profile.justification,
                    improvements: 'Pode buscar mais feedbacks.',
                },
            });

            // 5. Criar ManagerEvaluation (apenas para EMPLOYER)
            if (userRole === UserRole.EMPLOYER) {
                const managerEval = await this.prisma.managerEvaluation.create({
                    data: {
                        cycleId: cycle.id,
                        managerId: manager.id,
                        collaboratorId: user.id,
                    },
                });
                let mIdx = 0;
                for (const c of userCriteria) {
                    const mProfile = scoreProfiles[(userIdx + mIdx + 2) % scoreProfiles.length];
                    await this.prisma.managerEvaluationCriteria.create({
                        data: {
                            managerEvaluationId: managerEval.id,
                            criteriaId: c.criterionId,
                            score: mProfile.score,
                            justification: mProfile.justification,
                        },
                    });
                    mIdx++;
                }
            }

            // 6. Criar LeaderEvaluation (apenas para EMPLOYER)
            if (userRole === UserRole.EMPLOYER) {
                const leaderProfile = scoreProfiles[(userIdx + 3) % scoreProfiles.length];
                await this.prisma.leaderEvaluation.create({
                    data: {
                        leaderId: leader.id,
                        collaboratorId: user.id,
                        cycleId: cycle.id,
                        justification: leaderProfile.justification,
                        score: leaderProfile.score,
                        strengths: 'Destaque em colaboração.',
                        improvements: 'Pode melhorar a comunicação.',
                    },
                });
            }

            // 7. Criar Equalization (apenas para EMPLOYER)
            if (userRole === UserRole.EMPLOYER) {
                const eqProfile = scoreProfiles[(userIdx + 4) % scoreProfiles.length];
                await this.prisma.equalization.create({
                    data: {
                        collaboratorId: user.id,
                        cycleId: cycle.id,
                        committeeId: committee.id,
                        justification: eqProfile.justification,
                        score: eqProfile.score,
                        aiSummary: {
                            rating: eqProfile.score,
                            summary: eqProfile.justification,
                            discrepancies: [],
                            detailedAnalysis: 'Análise detalhada IA do seed',
                        },
                    },
                });
            }

            createdCount++;
        }

        return {
            message: `Seed de avaliações para 2025.2 concluído! Criadas ${createdCount} avaliações.`,
            createdCount,
            cycle: cycle.name,
        };
    }
}
