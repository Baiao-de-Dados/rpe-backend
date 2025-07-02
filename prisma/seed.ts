import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

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

    // Criptografar emails
    const encryptedEmailBackend = encrypt('backend@teste.com');
    const encryptedEmailFrontend = encrypt('frontend@teste.com');
    const encryptedEmailRh = encrypt('rh@teste.com');

    console.log('👥 Criando usuários...');

    // Usuário Backend/Desenvolvedor
    const userBackend = await prisma.user.create({
        data: {
            email: encryptedEmailBackend,
            password: hashedPassword,
            name: 'João Backend',
            track: 'Backend',
            position: 'Java Developer',
            userRoles: {
                create: [{ role: 'EMPLOYER' }],
            },
        },
    });

    // Usuário Frontend/Desenvolvedor
    const userFrontend = await prisma.user.create({
        data: {
            email: encryptedEmailFrontend,
            password: hashedPassword,
            name: 'Maria Frontend',
            track: 'Frontend',
            position: 'React Developer',
            userRoles: {
                create: [{ role: 'EMPLOYER' }],
            },
        },
    });

    // Usuário RH
    const userRh = await prisma.user.create({
        data: {
            email: encryptedEmailRh,
            password: hashedPassword,
            name: 'Ana RH',
            track: 'RH',
            position: 'Tester Planner',
            userRoles: {
                create: [{ role: 'RH' }],
            },
        },
    });

    console.log('🏗️ Criando pilares...');

    // Pilar Comportamento
    const pilarComportamento = await prisma.pillar.create({
        data: {
            name: 'COMPORTAMENTO',
        },
    });

    // Pilar Execução
    const pilarExecucao = await prisma.pillar.create({
        data: {
            name: 'EXECUÇÃO',
        },
    });

    // Pilar Gestão e Liderança
    const pilarGestao = await prisma.pillar.create({
        data: {
            name: 'GESTÃO E LIDERANÇA',
        },
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
            name: 'Resiliência nas Atividades',
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
        await prisma.criterion.create({
            data: {
                name: criterio.name,
                description: criterio.description,
                pillarId: pilarComportamento.id,
            },
        });
    }

    // Critérios do pilar Execução
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
        await prisma.criterion.create({
            data: {
                name: criterio.name,
                description: criterio.description,
                pillarId: pilarExecucao.id,
            },
        });
    }

    // Critérios do pilar Gestão e Liderança
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
        await prisma.criterion.create({
            data: {
                name: criterio.name,
                description: criterio.description,
                pillarId: pilarGestao.id,
            },
        });
    }

    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('👥 Usuários:');
    console.log(`   - Backend: backend@teste.com (senha: senha123) - ID: ${userBackend.id}`);
    console.log(`   - Frontend: frontend@teste.com (senha: senha123) - ID: ${userFrontend.id}`);
    console.log(`   - RH: rh@teste.com (senha: senha123) - ID: ${userRh.id}`);

    console.log('\n🏗️ Pilares:');
    console.log(`   - Comportamento (ID: ${pilarComportamento.id})`);
    console.log(`   - Execução (ID: ${pilarExecucao.id})`);
    console.log(`   - Gestão e Liderança (ID: ${pilarGestao.id})`);

    console.log('\n✅ Critérios criados:');
    console.log('   - Comportamento: 5 critérios');
    console.log('   - Execução: 4 critérios');
    console.log('   - Gestão e Liderança: 3 critérios');

    console.log('\n🧪 Próximos passos:');
    console.log('1. Login como rh@teste.com');
    console.log('2. Configurar trilhas/cargos dos usuários');
    console.log('3. Configurar critérios por trilha/cargo via API');
    console.log('4. Criar e ativar ciclos de avaliação');
    console.log('5. Testar com diferentes usuários');
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
