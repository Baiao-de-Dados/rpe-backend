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

    console.log('👥 Criando usuários...');

    // Usuário Backend/Desenvolvedor
    const userBackend = await prisma.user.create({
        data: {
            email: encryptedEmailBackend,
            password: hashedPassword,
            name: 'João Backend',
            track: 'Backend',
            position: 'Desenvolvedor',
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
            position: 'Desenvolvedor',
            userRoles: {
                create: [{ role: 'EMPLOYER' }],
            },
        },
    });

    console.log('🏗️ Criando pilares...');

    // Pilar Técnico
    const pilarTecnico = await prisma.pillar.create({
        data: {
            name: 'Técnico',
            description: 'Avaliação de competências técnicas e conhecimentos específicos',
        },
    });

    // Pilar Comportamental
    const pilarComportamental = await prisma.pillar.create({
        data: {
            name: 'Comportamental',
            description: 'Avaliação de soft skills e comportamentos no ambiente de trabalho',
        },
    });

    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('👥 Usuários:');
    console.log(`   - Backend: backend@teste.com (senha: senha123) - ID: ${userBackend.id}`);
    console.log(`   - Frontend: frontend@teste.com (senha: senha123) - ID: ${userFrontend.id}`);

    console.log('\n🏗️ Pilares:');
    console.log(`   - Técnico (ID: ${pilarTecnico.id})`);
    console.log(`   - Comportamental (ID: ${pilarComportamental.id})`);

    console.log('\n🧪 Próximos passos:');
    console.log('1. Login como backend@teste.com ou frontend@teste.com');
    console.log('2. Criar critérios para cada pilar');
    console.log('3. Configurar critérios por trilha/cargo');
    console.log('4. Testar com diferentes usuários');
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
