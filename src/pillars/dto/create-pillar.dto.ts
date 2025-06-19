import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePillarDto {
    @ApiProperty({
        example: 'Competências Técnicas',
        description: 'Nome do pilar',
    })
    @IsString()
    name: string;
}
