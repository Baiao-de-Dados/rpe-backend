const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testeAutoavaliacaoTrilhas() {
    console.log('🧪 TESTE: Autoavaliação por Trilha\n');

    try {
        // 1️⃣ Criar admin primeiro
        console.log('1️⃣ Criando admin...');
        try {
            const adminResponse = await axios.post(`${BASE_URL}/auth/setup-admin`);
            console.log('✅ Admin criado:', adminResponse.data.message);
        } catch (error) {
            console.log(
                '⚠️ Admin já existe ou erro:',
                error.response?.data?.message || 'Usando admin existente',
            );
        }

        // 2️⃣ Login como admin
        console.log('\n2️⃣ Login como admin...');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123',
        });
        const adminToken = adminLogin.data.access_token;
        console.log('✅ Login admin OK');

        // 3️⃣ Criar usuário RH
        console.log('\n3️⃣ Criando usuário RH...');
        const rhUser = await axios.post(
            `${BASE_URL}/auth/create-user`,
            {
                email: 'rh@teste.com',
                password: 'senha123',
                name: 'RH Teste',
                roles: ['RH'],
            },
            {
                headers: { Authorization: `Bearer ${adminToken}` },
            },
        );
        console.log('✅ Usuário RH criado:', rhUser.data.email);

        // 4️⃣ Login como RH
        console.log('\n4️⃣ Login como RH...');
        const rhLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'rh@teste.com',
            password: 'senha123',
        });
        const rhToken = rhLogin.data.access_token;
        console.log('✅ Login RH OK');

        // 5️⃣ Criar critério específico para Frontend
        console.log('\n5️⃣ Criando critério específico para Frontend...');
        const criterioFrontend = await axios.post(
            `${BASE_URL}/criteria`,
            {
                name: 'Conhecimento em React',
                description: 'Domínio de React e componentes',
                weight: 3.0,
                pillarId: 1,
            },
            {
                headers: { Authorization: `Bearer ${rhToken}` },
            },
        );
        console.log(
            `✅ Critério Frontend criado: ${criterioFrontend.data.name} (ID: ${criterioFrontend.data.id})`,
        );

        // 6️⃣ Configurar critério APENAS para Frontend
        console.log('\n6️⃣ Configurando critério APENAS para Frontend...');
        await axios.post(
            `${BASE_URL}/criteria/track-config`,
            {
                criterionId: criterioFrontend.data.id,
                track: 'Frontend', // APENAS Frontend
                position: 'Desenvolvedor',
                weight: 3.0,
                isActive: true,
            },
            {
                headers: { Authorization: `Bearer ${rhToken}` },
            },
        );
        console.log('✅ Critério configurado APENAS para Frontend');

        // 7️⃣ Configurar ciclo ativo
        console.log('\n7️⃣ Configurando ciclo ativo...');
        try {
            // Verificar se já existe um ciclo ativo
            const existingCycles = await axios.get(`${BASE_URL}/cycle-config`, {
                headers: { Authorization: `Bearer ${rhToken}` },
            });
            console.log('📋 Ciclos existentes:', existingCycles.data.length);

            // Se não há ciclos, criar um novo (muito simplificado)
            if (existingCycles.data.length === 0) {
                const cycleConfig = await axios.post(
                    `${BASE_URL}/cycle-config`,
                    {
                        name: '2025.1',
                        description: 'Ciclo de avaliação 2025.1',
                        startDate: '2025-01-01T00:00:00Z',
                        endDate: '2025-12-31T23:59:59Z',
                        isActive: true,
                        pillarConfigs: [], // Sem configurações de pilares
                        criterionConfigs: [], // Sem critérios por enquanto
                    },
                    {
                        headers: { Authorization: `Bearer ${rhToken}` },
                    },
                );
                console.log('✅ Ciclo ativo criado:', cycleConfig.data.name);
            } else {
                // Se já existe um ciclo, ativar o primeiro
                const firstCycle = existingCycles.data[0];
                console.log('✅ Usando ciclo existente:', firstCycle.name);
            }
        } catch (error) {
            console.log(
                '⚠️ Erro ao configurar ciclo:',
                error.response?.data?.message || 'Usando ciclo existente',
            );
        }

        // 8️⃣ Login como Backend
        console.log('\n8️⃣ Login como Backend...');
        const backendLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'backend@teste.com',
            password: 'senha123',
        });
        const backendToken = backendLogin.data.access_token;
        console.log('✅ Login Backend OK');

        // 9️⃣ Tentar fazer autoavaliação como Backend usando critério Frontend (deve falhar)
        console.log('\n9️⃣ Tentando autoavaliação Backend com critério Frontend (deve falhar)...');
        try {
            const avaliacaoBackend = await axios.post(
                `${BASE_URL}/evaluations`,
                {
                    ciclo: '2025.1',
                    colaboradorId: '1', // Backend
                    autoavaliacao: {
                        pilares: [
                            {
                                pilarId: '1',
                                criterios: [
                                    {
                                        criterioId: criterioFrontend.data.id.toString(), // Critério Frontend!
                                        nota: 4,
                                        justificativa: 'Backend tentando avaliar critério Frontend',
                                    },
                                ],
                            },
                        ],
                    },
                    avaliacao360: [],
                    mentoring: [],
                    referencias: [],
                },
                {
                    headers: { Authorization: `Bearer ${backendToken}` },
                },
            );
            console.log('❌ Backend conseguiu usar critério Frontend (não deveria!)');
            console.log('Resultado:', avaliacaoBackend.data);
        } catch (error) {
            console.log('✅ Backend NÃO conseguiu usar critério Frontend (esperado!)');
            console.log(`   Erro: ${error.response?.data?.message || error.message}`);
        }

        // 🔟 Login como Frontend e tentar usar critério Frontend (deve funcionar)
        console.log('\n🔟 Login como Frontend...');
        const frontendLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'frontend@teste.com',
            password: 'senha123',
        });
        const frontendToken = frontendLogin.data.access_token;
        console.log('✅ Login Frontend OK');

        // 1️⃣1️⃣ Tentar fazer autoavaliação como Frontend usando critério Frontend (deve funcionar)
        console.log(
            '\n1️⃣1️⃣ Tentando autoavaliação Frontend com critério Frontend (deve funcionar)...',
        );
        try {
            const avaliacaoFrontend = await axios.post(
                `${BASE_URL}/evaluations`,
                {
                    ciclo: '2025.1',
                    colaboradorId: '2', // Frontend
                    autoavaliacao: {
                        pilares: [
                            {
                                pilarId: '1',
                                criterios: [
                                    {
                                        criterioId: criterioFrontend.data.id.toString(), // Critério Frontend
                                        nota: 5,
                                        justificativa: 'Frontend avaliando critério Frontend',
                                    },
                                ],
                            },
                        ],
                    },
                    avaliacao360: [],
                    mentoring: [],
                    referencias: [],
                },
                {
                    headers: { Authorization: `Bearer ${frontendToken}` },
                },
            );
            console.log('✅ Frontend conseguiu usar critério Frontend!');
            console.log('Resultado:', avaliacaoFrontend.data);
        } catch (error) {
            console.log('❌ Frontend NÃO conseguiu usar critério Frontend');
            console.log(`   Erro: ${error.response?.data?.message || error.message}`);
        }

        // ===== RESUMO =====
        console.log('\n\n📊 RESUMO DO TESTE AUTOAVALIAÇÃO');
        console.log('==================================');
        console.log('🎯 Objetivo: Testar se autoavaliação respeita trilhas');
        console.log('🔵 Backend usando critério Frontend: ❌ Bloqueado (esperado)');
        console.log('🔴 Frontend usando critério Frontend: ✅ Permitido (esperado)');
        console.log('');
        console.log('💡 Sistema deve validar que:');
        console.log('   - Backend só pode usar critérios configurados para Backend');
        console.log('   - Frontend só pode usar critérios configurados para Frontend');
        console.log('   - Ou permitir critérios gerais para todas as trilhas');
    } catch (error) {
        console.error('❌ ERRO GERAL:', error.response?.data || error.message);
    }
}

testeAutoavaliacaoTrilhas();
