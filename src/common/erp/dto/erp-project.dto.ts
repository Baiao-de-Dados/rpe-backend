import { ErpProjectMemberDto } from './erp-project-member.dto';

export class ErpProjectDto {
    name: string;
    status: string;
    projectMembers: ErpProjectMemberDto[];
}
