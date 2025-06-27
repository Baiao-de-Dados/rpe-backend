import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RoleCompletionDto {
    @ApiProperty({ description: 'Role do usuário' })
    @IsString()
    role: string;

    @ApiProperty({ description: 'Total de usuários com esta role' })
    @IsNumber()
    totalUsers: number;

    @ApiProperty({ description: 'Usuários que completaram avaliação' })
    @IsNumber()
    completedUsers: number;

    @ApiProperty({ description: 'Usuários pendentes' })
    @IsNumber()
    pendingUsers: number;

    @ApiProperty({ description: 'Porcentagem de preenchimento (%)' })
    @IsNumber()
    completionPercentage: number;
}

export class RoleCompletionStatsDto {
    @ApiProperty({ description: 'Estatísticas por role', type: [RoleCompletionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoleCompletionDto)
    roles: RoleCompletionDto[];

    @ApiProperty({ description: 'Data/hora da última atualização dos dados' })
    @IsString()
    lastUpdated: string;
}
