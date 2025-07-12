import { ApiProperty } from '@nestjs/swagger';

export class GeminiLeaderResponseDto {
    @ApiProperty({
        example: 'SUCCESS',
        enum: ['SUCCESS', 'NO_INSIGHT', 'ERROR'],
    })
    code: 'SUCCESS' | 'NO_INSIGHT' | 'ERROR';

    @ApiProperty({ example: 'Mensagem de erro detalhada', required: false })
    error?: string;

    @ApiProperty({
        example:
            'É perceptível que o time apresentou desempenho consistente em comunicação e entrega, com boa colaboração entre os membros. A maioria dos colaboradores demonstra alinhamento entre a autoavaliação, sua avaliação e a nota final, o que reforça a confiabilidade dos feedbacks. Contudo, há discrepâncias importantes em alguns casos, especialmente nas avaliações relacionadas à gestão do tempo, onde colaboradores tendem a se autoavaliar com notas mais altas do que as recebidas de você e na avaliação final. Áreas como autonomia e proatividade também apresentam variações entre as fontes, indicando oportunidades para alinhamento e desenvolvimento focado. Recomenda-se atenção especial a esses pontos para promover maior consistência e evolução no próximo ciclo.',
        required: false,
        description:
            'Resumo [200-500 caracteres] que sintetiza o desempenho geral dos colaboradores, aponta discrepâncias entre autoavaliação, avaliação do líder e nota final, destaca pontos fortes e oportunidades de melhoria, e fornece informações úteis para apoiar a gestão e o desenvolvimento dos liderados.',
    })
    summary?: string;
}
