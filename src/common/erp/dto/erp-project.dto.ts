import { ErpProjectMemberDto } from './erp-project-member.dto';

export class ErpProjectDto {
    name: string;
    status: string;
    manager: ErpProjectMemberDto;
    leaders: ErpProjectMemberDto[];
    collaborators: ErpProjectMemberDto[];
}
