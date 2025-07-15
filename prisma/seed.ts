import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { getBrazilDate } from '../src/cycles/utils';

const prisma = new PrismaClient();

// Simular a mesma lógica do EncryptionService
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

async function main() {
    console.log('🌱 Iniciando seed com reset completo...');

    // Hash das senhas
    const hashedPassword = await bcrypt.hash('senha123', 10);

    // Emails em texto puro
    const emailBackend = 'backend@teste.com';
    const emailFrontend = 'frontend@teste.com';
    const emailRh = 'rh@teste.com';

    console.log('👥 Criando usuários...');

    console.log('🚀 Criando trilhas...');
    const trackBackend = await prisma.track.upsert({
        where: { name: 'Backend' },
        update: {},
        create: { name: 'Backend' },
    });
    const trackFrontend = await prisma.track.upsert({
        where: { name: 'Frontend' },
        update: {},
        create: { name: 'Frontend' },
    });
    const trackRH = await prisma.track.upsert({
        where: { name: 'RH' },
        update: {},
        create: { name: 'RH' },
    });

    // Usuário Mentor Dummy
    const dummyMentor = await prisma.user.create({
        data: {
            email: encrypt('dummy@teste.com'),
            password: hashedPassword,
            name: 'Dummy',
            position: 'Mentor',
            mentorId: null, // será ajustado depois
            trackId: trackBackend.id,
        },
    });

    // Usuário Mentor real, apontando para o dummy
    const mentor = await prisma.user.create({
        data: {
            email: encrypt('mentor@teste.com'),
            password: hashedPassword,
            name: 'Mentor Dummy',
            position: 'Mentor',
            mentorId: dummyMentor.id,
            trackId: trackBackend.id,
        },
    });

    // Atualiza o dummy para apontar para o mentor real
    await prisma.user.update({
        where: { id: dummyMentor.id },
        data: { mentorId: mentor.id },
    });

    // Usuário Backend/Desenvolvedor
    const userBackend = await prisma.user.upsert({
        where: { email: emailBackend },
        update: {},
        create: {
            email: emailBackend,
            password: hashedPassword,
            name: 'João Backend',
            position: 'DEV Backend',
            mentorId: mentor.id,
            trackId: trackBackend.id,
            userRoles: {
                create: [{ role: 'EMPLOYER' }],
            },
        },
    });

    // Usuário Frontend/Desenvolvedor
    const userFrontend = await prisma.user.create({
        data: {
            email: emailFrontend,
            password: hashedPassword,
            name: 'Maria Frontend',
            position: 'DEV Frontend',
            mentorId: mentor.id,
            trackId: trackFrontend.id,
            userRoles: {
                create: [{ role: 'EMPLOYER' }],
            },
        },
    });

    // Usuário RH
    const userRh = await prisma.user.create({
        data: {
            email: emailRh,
            password: hashedPassword,
            name: 'Ana RH',
            position: 'RH tester',
            mentorId: mentor.id,
            trackId: trackRH.id,
            userRoles: {
                create: [{ role: 'RH' }],
            },
        },
    });

    // Usuários do payload.json
    const emailVitor = 'vitor.gabriel@rocketcorp.com';
    const emailYuri = 'yuri.da@rocketcorp.com';

    // Criar ou obter mentor para os dois (Luiza Carvalho)
    const emailLuiza = 'luiza.carvalho@rocketcorp.com';
    let mentorLuiza = await prisma.user.findUnique({ where: { email: emailLuiza } });
    if (!mentorLuiza) {
        mentorLuiza = await prisma.user.create({
            data: {
                email: emailLuiza,
                password: hashedPassword,
                name: 'Luiza Carvalho',
                position: 'BUSINESSMAN',
                trackId: trackBackend.id, // ou outra track se preferir
                userRoles: { create: [{ role: 'MENTOR' }] },
            },
        });
    }

    // Vitor Gabriel
    await prisma.user.create({
        data: {
            email: emailVitor,
            password: hashedPassword,
            name: 'Vitor Gabriel',
            position: 'BUSINESSMAN',
            mentorId: mentorLuiza.id,
            trackId: trackBackend.id,
            userRoles: { create: [{ role: 'EMPLOYER' }] },
        },
    });

    // Yuri Da
    await prisma.user.create({
        data: {
            email: emailYuri,
            password: hashedPassword,
            name: 'Yuri Da',
            position: 'BUSINESSMAN',
            mentorId: mentorLuiza.id,
            trackId: trackBackend.id,
            userRoles: { create: [{ role: 'EMPLOYER' }] },
        },
    });

    console.log('👨‍💼 Criando gestor...');

    // Usuário Gestor
    const encryptedEmailManager = encrypt('manager@teste.com');
    const manager = await prisma.user.create({
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

    console.log('👨‍💻 Criando líderes...');

    // Usuário Líder 1
    const encryptedEmailLeader1 = encrypt('leader1@teste.com');
    const leader1 = await prisma.user.create({
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
    const leader2 = await prisma.user.create({
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

    console.log('🏢 Criando projeto...');

    // Projeto
    const project = await prisma.project.create({
        data: {
            name: 'Sistema de Avaliações',
            description: 'Projeto para desenvolvimento do sistema de avaliações da RocketCorp',
            status: 'ACTIVE',
            managerId: manager.id,
        },
    });

    console.log('👥 Adicionando membros ao projeto...');

    // Adicionar membros ao projeto (gestor, líderes e desenvolvedores)
    await prisma.projectMember.createMany({
        data: [
            { projectId: project.id, userId: manager.id }, // Gestor
            { projectId: project.id, userId: leader1.id }, // Líder 1
            { projectId: project.id, userId: leader2.id }, // Líder 2
            { projectId: project.id, userId: userBackend.id }, // Dev Backend
            { projectId: project.id, userId: userFrontend.id }, // Dev Frontend
        ],
    });

    console.log('🔗 Criando assignments de líderes...');

    // Assignment de líderes ao projeto
    await prisma.leaderAssignment.createMany({
        data: [
            { projectId: project.id, leaderId: leader1.id },
            { projectId: project.id, leaderId: leader2.id },
        ],
    });

    console.log('🏗️ Criando pilares...');

    // Pilares: Comportamento, Execução e Gestão
    const pilarComportamento = await prisma.pillar.upsert({
        where: { name: 'COMPORTAMENTO' },
        update: {},
        create: { name: 'COMPORTAMENTO' },
    });
    const pilarExecucao = await prisma.pillar.upsert({
        where: { name: 'EXECUÇÃO' },
        update: {},
        create: { name: 'EXECUÇÃO' },
    });
    const pilarGestao = await prisma.pillar.upsert({
        where: { name: 'GESTÃO E LIDERANÇA' },
        update: {},
        create: { name: 'GESTÃO E LIDERANÇA' },
    });

    console.log('✅ Criando critérios...');

    // Critérios do pilar Comportamento
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
        await prisma.criterion.upsert({
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

    // Critérios do pilar Execução
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
        await prisma.criterion.upsert({
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

    // Critérios do pilar Gestão e Liderança
    const criteriosGestao = [
        { name: 'Gente', description: 'Desenvolve e lidera pessoas de forma efetiva.' },
        {
            name: 'Resultados',
            description: 'Foca em entregar resultados consistentes e mensuráveis.',
        },
        {
            name: 'Evolução da Rocket Cor',
            description: 'Contribui para o crescimento e evolução da empresa.',
        },
    ];

    for (const criterio of criteriosGestao) {
        await prisma.criterion.upsert({
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

    // Criação de ciclo ativo customizado
    console.log('🌀 Criando ciclo ativo customizado...');
    const cicloAtivo = await prisma.cycleConfig.create({
        data: {
            name: 'Ciclo Customizado',
            description: 'Ciclo ativo para testes customizados',
            startDate: new Date(getBrazilDate().getTime() - 1000 * 60 * 60 * 24), // ontem
            endDate: new Date(getBrazilDate().getTime() + 1000 * 60 * 60 * 24 * 30), // +30 dias
            done: false,
        },
    });

    // Configuração customizada de critérios por ciclo/trilha/pilar
    // Especificação do usuário:
    const customConfig = [
        {
            trackId: 1, // Backend
            pillars: [
                {
                    id: 1, // Pilar 1
                    criteria: [
                        { id: 4, weight: 10 },
                        { id: 5, weight: 20 },
                    ],
                },
                {
                    id: 2, // Pilar 2
                    criteria: [{ id: 6, weight: 30 }],
                },
            ],
        },
    ];

    // Cria as configs de CriterionTrackCycleConfig
    for (const track of customConfig) {
        for (const pillar of track.pillars) {
            for (const criterio of pillar.criteria) {
                await prisma.criterionTrackCycleConfig.create({
                    data: {
                        cycleId: cicloAtivo.id,
                        trackId: track.trackId,
                        criterionId: criterio.id,
                        weight: criterio.weight,
                    },
                });
            }
        }
    }

    console.log('✅ Ciclo ativo customizado criado!');

    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('👥 Usuários:');
    console.log(`   - Backend: backend@teste.com (senha: senha123) - ID: ${userBackend.id}`);
    console.log(`   - Frontend: frontend@teste.com (senha: senha123) - ID: ${userFrontend.id}`);
    console.log(`   - RH: rh@teste.com (senha: senha123) - ID: ${userRh.id}`);
    console.log(`   - Gestor: manager@teste.com (senha: senha123) - ID: ${manager.id}`);
    console.log(`   - Líder 1: leader1@teste.com (senha: senha123) - ID: ${leader1.id}`);
    console.log(`   - Líder 2: leader2@teste.com (senha: senha123) - ID: ${leader2.id}`);

    console.log('\n🏢 Projeto:');
    console.log(`   - Sistema de Avaliações (ID: ${project.id})`);
    console.log(`   - Gestor: Carlos Gestor (ID: ${manager.id})`);
    console.log(`   - Líderes: Pedro Líder (ID: ${leader1.id}), Sofia Líder (ID: ${leader2.id})`);

    console.log('\n🏗️ Pilares:');
    console.log(`   - Comportamento (ID: ${pilarComportamento.id})`);
    console.log(`   - Execução (ID: ${pilarExecucao.id})`);
    console.log(`   - Gestão e Liderança (ID: ${pilarGestao.id})`);

    console.log('\n✅ Critérios criados:');
    console.log('   - Comportamento: 5 critérios');
    console.log('   - Execução: 4 critérios');
    console.log('   - Gestão e Liderança: 3 critérios');

    console.log('\n🧪 Próximos passos:');
    console.log('1. Login como manager@teste.com (gestor)');
    console.log('2. Testar assignment de líderes via API /manager/assign-leader');
    console.log('3. Listar líderes via API /manager/projects/:projectId/leaders');
    console.log('4. Configurar trilhas/cargos dos usuários');
    console.log('5. Configurar critérios por trilha/cargo via API');
    console.log('6. Criar e ativar ciclos de avaliação');
    console.log('7. Testar com diferentes usuários');
}

// Executar o seed
(async () => {
    try {
        await main();
    } catch (e) {
        console.error('❌ Erro durante o seed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
})();
