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
    console.log('🌱 Iniciando seed do banco de dados...');

    // Hash das senhas
    const hashedPassword = await bcrypt.hash('senha123', 10);

    // Criptografar emails
    const encryptedEmailRH = encrypt('rh@teste.com');
    const encryptedEmailFuncionario = encrypt('funcionario@teste.com');
    const encryptedEmailLider = encrypt('lider@teste.com');
    const encryptedEmailMentor = encrypt('mentor@teste.com');

    console.log('👥 Criando usuários...');

    // Usuário RH
    await prisma.user.create({
        data: {
            email: encryptedEmailRH,
            password: hashedPassword,
            name: 'RH Teste',
            track: 'RH',
            userRoles: {
                create: [{ role: 'RH' }],
            },
        },
    });

    // Usuário Funcionário
    const userFuncionario = await prisma.user.create({
        data: {
            email: encryptedEmailFuncionario,
            password: hashedPassword,
            name: 'João Silva',
            track: 'Backend',
            userRoles: {
                create: [{ role: 'EMPLOYER' }],
            },
        },
    });

    // Usuário Líder
    const userLider = await prisma.user.create({
        data: {
            email: encryptedEmailLider,
            password: hashedPassword,
            name: 'Maria Santos',
            track: 'Backend',
            userRoles: {
                create: [{ role: 'LEADER' }],
            },
        },
    });

    // Usuário Mentor
    const userMentor = await prisma.user.create({
        data: {
            email: encryptedEmailMentor,
            password: hashedPassword,
            name: 'Pedro Costa',
            track: 'Backend',
            userRoles: {
                create: [{ role: 'MENTOR' }],
            },
        },
    });

    console.log('🏗️ Criando pilares...');

    // Pilares
    const pilarTecnico = await prisma.pillar.create({
        data: {
            name: 'Técnico',
            description: 'Avaliação de competências técnicas e conhecimentos específicos',
        },
    });

    const pilarComportamental = await prisma.pillar.create({
        data: {
            name: 'Comportamental',
            description: 'Avaliação de soft skills e comportamentos no ambiente de trabalho',
        },
    });

    const pilarLideranca = await prisma.pillar.create({
        data: {
            name: 'Liderança',
            description: 'Avaliação de competências de liderança e gestão',
        },
    });

    console.log('📋 Criando critérios...');

    // Critérios Técnicos
    const criterioQualidadeCodigo = await prisma.criterion.create({
        data: {
            name: 'Qualidade do Código',
            description: 'Avalia a qualidade, legibilidade e manutenibilidade do código produzido',
            weight: 1.0,
            pillarId: pilarTecnico.id,
        },
    });

    const criterioDocumentacao = await prisma.criterion.create({
        data: {
            name: 'Documentação',
            description: 'Avalia a qualidade e completude da documentação técnica',
            weight: 1.0,
            pillarId: pilarTecnico.id,
        },
    });

    const criterioArquitetura = await prisma.criterion.create({
        data: {
            name: 'Arquitetura e Design',
            description: 'Avalia a capacidade de criar soluções arquiteturais adequadas',
            weight: 1.0,
            pillarId: pilarTecnico.id,
        },
    });

    // Critérios Comportamentais
    const criterioTrabalhoEquipe = await prisma.criterion.create({
        data: {
            name: 'Trabalho em Equipe',
            description: 'Avalia a colaboração e contribuição efetiva no trabalho em equipe',
            weight: 1.0,
            pillarId: pilarComportamental.id,
        },
    });

    const criterioComunicacao = await prisma.criterion.create({
        data: {
            name: 'Comunicação',
            description: 'Avalia a clareza e eficácia na comunicação oral e escrita',
            weight: 1.0,
            pillarId: pilarComportamental.id,
        },
    });

    const criterioProatividade = await prisma.criterion.create({
        data: {
            name: 'Proatividade',
            description: 'Avalia a iniciativa e busca por melhorias contínuas',
            weight: 1.0,
            pillarId: pilarComportamental.id,
        },
    });

    // Critérios de Liderança
    const criterioGestaoTime = await prisma.criterion.create({
        data: {
            name: 'Gestão de Time',
            description: 'Avalia a capacidade de liderar e motivar equipes',
            weight: 1.0,
            pillarId: pilarLideranca.id,
        },
    });

    const criterioTomadaDecisao = await prisma.criterion.create({
        data: {
            name: 'Tomada de Decisão',
            description: 'Avalia a capacidade de tomar decisões assertivas e responsáveis',
            weight: 1.0,
            pillarId: pilarLideranca.id,
        },
    });

    console.log('🔄 Criando configuração de ciclo...');

    // Configuração do Ciclo 2025.1
    const ciclo2025_1 = await prisma.cycleConfig.create({
        data: {
            name: '2025.1',
            description: 'Ciclo de avaliação 2025.1 - Primeiro semestre',
            startDate: new Date('2025-01-01'),
            endDate: new Date('2025-06-30'),
            isActive: true,
        },
    });

    // Configuração dos Pilares no Ciclo
    await prisma.pillarCycleConfig.createMany({
        data: [
            {
                cycleId: ciclo2025_1.id,
                pillarId: pilarTecnico.id,
                isActive: true,
                weight: 1.0,
            },
            {
                cycleId: ciclo2025_1.id,
                pillarId: pilarComportamental.id,
                isActive: true,
                weight: 1.0,
            },
            {
                cycleId: ciclo2025_1.id,
                pillarId: pilarLideranca.id,
                isActive: false, // Pilar de liderança inativo neste ciclo
                weight: 0.0,
            },
        ],
    });

    // Configuração dos Critérios no Ciclo
    await prisma.criterionCycleConfig.createMany({
        data: [
            // Critérios Técnicos (ativos)
            {
                cycleId: ciclo2025_1.id,
                criterionId: criterioQualidadeCodigo.id,
                isActive: true,
                weight: 1.0,
            },
            {
                cycleId: ciclo2025_1.id,
                criterionId: criterioDocumentacao.id,
                isActive: true,
                weight: 1.0,
            },
            {
                cycleId: ciclo2025_1.id,
                criterionId: criterioArquitetura.id,
                isActive: false, // Critério inativo neste ciclo
                weight: 0.0,
            },
            // Critérios Comportamentais (ativos)
            {
                cycleId: ciclo2025_1.id,
                criterionId: criterioTrabalhoEquipe.id,
                isActive: true,
                weight: 1.0,
            },
            {
                cycleId: ciclo2025_1.id,
                criterionId: criterioComunicacao.id,
                isActive: true,
                weight: 1.0,
            },
            {
                cycleId: ciclo2025_1.id,
                criterionId: criterioProatividade.id,
                isActive: false, // Critério inativo neste ciclo
                weight: 0.0,
            },
            // Critérios de Liderança (inativos - pilar inativo)
            {
                cycleId: ciclo2025_1.id,
                criterionId: criterioGestaoTime.id,
                isActive: false,
                weight: 0.0,
            },
            {
                cycleId: ciclo2025_1.id,
                criterionId: criterioTomadaDecisao.id,
                isActive: false,
                weight: 0.0,
            },
        ],
    });

    console.log('🏷️ Criando tags...');

    // Tags
    await prisma.tag.create({ data: { name: 'Backend' } });
    await prisma.tag.create({ data: { name: 'Frontend' } });
    await prisma.tag.create({ data: { name: 'Liderança' } });
    await prisma.tag.create({ data: { name: 'Comunicação' } });

    console.log('📝 Criando referências...');

    // Referências
    await prisma.reference.create({
        data: {
            fromId: userLider.id,
            toId: userFuncionario.id,
            tags: ['Backend', 'Liderança'],
            comment: 'Excelente desenvolvedor com grande potencial de liderança',
        },
    });

    await prisma.reference.create({
        data: {
            fromId: userMentor.id,
            toId: userFuncionario.id,
            tags: ['Backend', 'Comunicação'],
            comment: 'Muito bom em explicar conceitos técnicos para a equipe',
        },
    });

    console.log('✅ Seed concluída com sucesso!');
    console.log('\n📊 Resumo dos dados criados:');
    console.log('👥 Usuários:');
    console.log(`   - RH: rh@teste.com (senha: senha123)`);
    console.log(`   - Funcionário: funcionario@teste.com (senha: senha123)`);
    console.log(`   - Líder: lider@teste.com (senha: senha123)`);
    console.log(`   - Mentor: mentor@teste.com (senha: senha123)`);

    console.log('\n🏗️ Pilares:');
    console.log(`   - Técnico (ID: ${pilarTecnico.id}) - ATIVO`);
    console.log(`   - Comportamental (ID: ${pilarComportamental.id}) - ATIVO`);
    console.log(`   - Liderança (ID: ${pilarLideranca.id}) - INATIVO`);

    console.log('\n📋 Critérios ATIVOS no ciclo 2025.1:');
    console.log(`   - Qualidade do Código (ID: ${criterioQualidadeCodigo.id})`);
    console.log(`   - Documentação (ID: ${criterioDocumentacao.id})`);
    console.log(`   - Trabalho em Equipe (ID: ${criterioTrabalhoEquipe.id})`);
    console.log(`   - Comunicação (ID: ${criterioComunicacao.id})`);

    console.log('\n📋 Critérios INATIVOS no ciclo 2025.1:');
    console.log(`   - Arquitetura e Design (ID: ${criterioArquitetura.id})`);
    console.log(`   - Proatividade (ID: ${criterioProatividade.id})`);
    console.log(`   - Gestão de Time (ID: ${criterioGestaoTime.id})`);
    console.log(`   - Tomada de Decisão (ID: ${criterioTomadaDecisao.id})`);

    console.log('\n🔄 Ciclo configurado: 2025.1 (ATIVO)');

    console.log('\n🧪 Para testar:');
    console.log('1. Acesse GET /evaluations/active-criteria para ver critérios ativos');
    console.log('2. Acesse GET /evaluations/active-criteria/grouped para ver agrupados por pilar');
    console.log('3. Tente criar autoavaliação com critérios ativos (deve funcionar)');
    console.log('4. Tente criar autoavaliação com critérios inativos (deve falhar)');
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
