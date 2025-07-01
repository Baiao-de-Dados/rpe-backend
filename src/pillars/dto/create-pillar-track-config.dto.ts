import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePillarTrackConfigDto {
    @ApiProperty({ description: 'ID do pilar' })
    @IsInt()
    pillarId: number;

    @ApiProperty({ description: 'Trilha do usuário', required: true })
    @IsString()
    track: string;

    @ApiProperty({ description: 'Se o pilar está ativo para esta trilha', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
