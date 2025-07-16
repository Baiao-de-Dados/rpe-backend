export class ErpProjectMemberDto {
    email: string;
    position: string;
    role: 'MANAGER' | 'LEADER' | 'EMPLOYER';
    startDate: string;
    endDate: string | null;
}
