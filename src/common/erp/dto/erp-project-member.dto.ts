export class ErpProjectMemberDto {
    email: string;
    position: string;
    role: 'MANAGER' | 'LEADER' | 'EMPLOYER';
    startDate: string;
    name: string;
    track: string | null;
    endDate: string | null;
}
