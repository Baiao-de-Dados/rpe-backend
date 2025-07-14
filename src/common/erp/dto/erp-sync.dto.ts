import { ErpUserDto } from './erp-user.dto';
import { ErpProjectDto } from './erp-project.dto';

export class ErpSyncDto {
    users: ErpUserDto[];
    projects: ErpProjectDto[];
}
