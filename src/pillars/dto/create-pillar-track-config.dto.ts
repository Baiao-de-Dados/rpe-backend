import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePillarTrackConfigDto {
    @ApiProperty({ description: 'ID do pilar' })
    @IsInt()
    pillarId: number;

    @ApiProperty({ description: 'Trilha do usuário', required: false })
    @IsOptional()
    @IsString()
    track?: string;

    @ApiProperty({ description: 'Cargo do usuário', required: false })
    @IsOptional()
    @IsString()
    position?: string;

    @ApiProperty({ description: 'Se o pilar está ativo para esta trilha/cargo', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
