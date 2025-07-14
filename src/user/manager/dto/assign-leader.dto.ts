import { IsInt } from 'class-validator';

export class AssignLeaderDto {
    @IsInt()
    projectId: number;

    @IsInt()
    leaderId: number;
}
