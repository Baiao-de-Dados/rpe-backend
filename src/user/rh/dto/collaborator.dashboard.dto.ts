import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CollaboratorStatusBreakdownDto {
    @ApiProperty()
    @IsBoolean()
    autoEvaluation: boolean;

    @ApiProperty()
    @IsBoolean()
    evaluation360: boolean;

    @ApiProperty()
    @IsBoolean()
    mentoring: boolean;

    @ApiProperty()
    @IsBoolean()
    references: boolean;
}

export class CollaboratorStatusDto {
    @ApiProperty({ description: 'ID do colaborador' })
    @IsNumber()
    id: number;

    @ApiProperty({ description: 'Nome do colaborador' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Email do colaborador' })
    @IsString()
    email: string;

    @ApiProperty({ description: 'Ciclo da avaliação' })
    @IsString()
    CycleConfigId: string;

    @ApiProperty({ description: 'Status da avaliação (finalizado/pendente)' })
    @IsString()
    status: 'finalizado' | 'pendente';

    @ApiProperty({ description: 'Detalhamento do preenchimento' })
    @ValidateNested()
    @Type(() => CollaboratorStatusBreakdownDto)
    breakdown: CollaboratorStatusBreakdownDto;

    @ApiProperty({ description: 'Data de criação da avaliação' })
    @IsString()
    createdAt: string;
}

export class CollaboratorsStatusDto {
    @ApiProperty({
        description: 'Lista de status dos colaboradores',
        type: [CollaboratorStatusDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CollaboratorStatusDto)
    collaborators: CollaboratorStatusDto[];

    @ApiProperty({ description: 'Total de colaboradores' })
    @IsNumber()
    total: number;

    @ApiProperty({ description: 'Colaboradores finalizados' })
    @IsNumber()
    completed: number;

    @ApiProperty({ description: 'Colaboradores pendentes' })
    @IsNumber()
    pending: number;
}
