const BASE_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

async function login() {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    const data = await res.json();
    return data.access_token;
}

async function setCurrentCycle(token, cycle) {
    const res = await fetch(`${BASE_URL}/system-config/current-cycle`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cycle }),
    });
    const data = await res.json();
    console.log('Set cycle response:', data);
}

async function getCurrentCycle(token) {
    const res = await fetch(`${BASE_URL}/system-config/current-cycle`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    console.log('Current cycle:', data.currentCycle);
}

(async () => {
    const token = await login();
    await setCurrentCycle(token, '2025-07'); // Defina o ciclo desejado aqui
    await getCurrentCycle(token);
})();
