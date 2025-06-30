export function gerarEmail(name: string): string {
    return (
        name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z\s]/g, '')
            .trim()
            .replace(/\s+/g, '-') + '@rocket.com'
    );
}

export function gerarNome(email: string): string {
    const [parte] = email.split('@');
    return parte
        .split('.')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
}
