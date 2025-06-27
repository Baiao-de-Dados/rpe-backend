import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCriterionTrackConfigDto {
    @ApiProperty({ description: 'ID do critério' })
    @IsInt()
    criterionId: number;

    @ApiProperty({ description: 'Trilha do usuário', required: false })
    @IsOptional()
    @IsString()
    track?: string;

    @ApiProperty({ description: 'Cargo do usuário', required: false })
    @IsOptional()
    @IsString()
    position?: string;

    @ApiProperty({ description: 'Se o critério está ativo para esta trilha/cargo', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Peso do critério para esta trilha/cargo', default: 1.0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    weight?: number;
}
