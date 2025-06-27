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
    // Hash das senhas
    const hashedPassword = await bcrypt.hash('senha123', 10);

    // Criptografar emails
    const encryptedEmail1 = encrypt('avaliador@teste.com');
    const encryptedEmail2 = encrypt('avaliado@teste.com');

    console.log('ENCRYPTION_KEY:', SECRET);
    console.log('Email 1 criptografado:', encryptedEmail1);
    console.log('Email 2 criptografado:', encryptedEmail2);

    // Usuários
    const user1 = await prisma.user.create({
        data: {
            email: encryptedEmail1,
            password: hashedPassword,
            name: 'Avaliador',
            userRoles: {
                create: [{ role: 'EMPLOYER' }],
            },
        },
    });

    const user2 = await prisma.user.create({
        data: {
            email: encryptedEmail2,
            password: hashedPassword,
            name: 'Avaliado',
            userRoles: {
                create: [{ role: 'EMPLOYER' }],
            },
        },
    });

    // Pilares
    const pilar1 = await prisma.pillar.create({
        data: { name: 'Técnico', description: 'Avaliação Técnica' },
    });
    const pilar2 = await prisma.pillar.create({
        data: { name: 'Comportamental', description: 'Avaliação Comportamental' },
    });

    // Critérios
    const criterio1 = await prisma.criterion.create({
        data: {
            name: 'Domínio Técnico',
            description: 'Conhecimento técnico nas ferramentas',
            weight: 1,
            pillarId: pilar1.id,
        },
    });
    const criterio2 = await prisma.criterion.create({
        data: {
            name: 'Documentação',
            description: 'Qualidade da documentação',
            weight: 1,
            pillarId: pilar1.id,
        },
    });
    const criterio3 = await prisma.criterion.create({
        data: {
            name: 'Trabalho em Equipe',
            description: 'Colaboração com o time',
            weight: 1,
            pillarId: pilar2.id,
        },
    });

    // Tags
    const tag1 = await prisma.tag.create({ data: { name: 'Backend' } });
    const tag2 = await prisma.tag.create({ data: { name: 'Liderança' } });

    // Referencias
    const reference1 = await prisma.reference.create({
        data: {
            fromId: user1.id,
            toId: user2.id,
            tags: ['Backend', 'Liderança'],
            comment: 'Excelente trabalho em equipe',
        },
    });

    console.log('Seed concluída com sucesso!');
    console.log('Usuários:', {
        user1: { ...user1, email: 'avaliador@teste.com' },
        user2: { ...user2, email: 'avaliado@teste.com' },
    });
    console.log('Pilares:', { pilar1, pilar2 });
    console.log('Critérios:', { criterio1, criterio2, criterio3 });
    console.log('Tags:', { tag1, tag2 });
    console.log('Referências:', { reference1 });
}

// Executar o seed
(async () => {
    try {
        await main();
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
})();
