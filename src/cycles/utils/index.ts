import { toZonedTime } from 'date-fns-tz';

// Utilitário para obter a data atual em GMT-3 (Horário de Brasília)
export function getBrazilDate(): Date {
    const now = new Date();
    // 'America/Sao_Paulo' representa o horário oficial de Brasília (GMT-3)
    return toZonedTime(now, 'America/Sao_Paulo');
}

export function isCycleActiveUtil(cycle: {
    done: boolean;
    startDate: Date | null;
    endDate: Date | null;
}): boolean {
    if (cycle.startDate === null || cycle.endDate === null) {
        return false;
    }
    const now = getBrazilDate();
    return !cycle.done && now >= cycle.startDate && now <= cycle.endDate;
}

export function getCurrentSemesterName(): string {
    const now = getBrazilDate();
    const year = now.getFullYear();
    const semester = now.getMonth() + 1 <= 6 ? 1 : 2;
    return `${year}.${semester}`;
}
