import { ApiProperty } from '@nestjs/swagger';

export class GeminiEqualizationResponseDto {
    @ApiProperty({
        example: 'SUCCESS',
        enum: ['SUCCESS', 'NO_INSIGHT', 'ERROR'],
    })
    code: 'SUCCESS' | 'NO_INSIGHT' | 'ERROR';

    @ApiProperty({ example: 'Mensagem de erro detalhada', required: false })
    error?: string;

    @ApiProperty({
        example: 4,
        required: false,
        description: 'Nota sugerida de 1 a 5 para o colaborador.',
    })
    rating?: number;

    @ApiProperty({
        example: 'Texto detalhado da análise do desempenho...',
        required: false,
        description:
            'Texto detalhado [200-500 caracteres] explicando convergências, divergências, justificativa técnica, considerações e influência dos feedbacks.',
    })
    detailedAnalysis?: string;

    @ApiProperty({
        example: 'Resumo detalhado do desempenho...',
        required: false,
        description: 'Resumo [50-200 caracteres] sintetizando o desempenho do colaborador.',
    })
    summary?: string;

    @ApiProperty({
        example: 'Texto sobre discrepâncias...',
        required: false,
        description:
            'Texto [100-300 caracteres] apontando discrepâncias significativas entre avaliações recebidas e autoavaliação.',
    })
    discrepancies?: string;
}
