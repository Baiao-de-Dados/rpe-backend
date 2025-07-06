import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchUpdateCriterionItemDto {
    @ApiProperty({
        example: 1,
        description: 'ID único do critério (número)',
    })
    id: number;

    @ApiProperty({
        example: 'Sentimento de Dono',
        description: 'Nome do critério',
    })
    @IsString()
    name: string;

    @ApiProperty({
        example: 'Demonstra responsabilidade e senso de pertencimento nas tarefas e resultados.',
        description: 'Descrição do critério',
    })
    @IsString()
    description: string;
}

export class BatchUpdateCriteriaDto {
    @ApiProperty({
        type: [BatchUpdateCriterionItemDto],
        description: 'Array de critérios para atualizar',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BatchUpdateCriterionItemDto)
    criteria: BatchUpdateCriterionItemDto[];
}
