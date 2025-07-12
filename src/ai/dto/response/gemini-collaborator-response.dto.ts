import { ApiProperty } from '@nestjs/swagger';

export class GeminiCollaboratorResponseDto {
    @ApiProperty({
        example: 'SUCCESS',
        enum: ['SUCCESS', 'NO_INSIGHT', 'ERROR'],
    })
    code: 'SUCCESS' | 'NO_INSIGHT' | 'ERROR';

    @ApiProperty({ example: 'Mensagem de erro detalhada', required: false })
    error?: string;

    @ApiProperty({
        example:
            'Você teve um desempenho bastante consistente ao longo do ciclo. Sua proatividade, senso de responsabilidade e colaboração com o time foram pontos muito valorizados nas avaliações — tanto pelo gestor quanto refletidos na sua própria percepção. É nítido o cuidado que você tem com a qualidade das entregas e com a forma como se comunica com as pessoas ao seu redor. Um ponto que vale atenção para o próximo ciclo é desenvolver uma visão mais estratégica no planejamento das atividades e na gestão do tempo, especialmente em contextos de múltiplas demandas. De forma geral, você mostrou evolução contínua e está cada vez mais preparado para assumir desafios maiores. Parabéns pelo ciclo!',
        required: false,
        description:
            'Resumo [200-500 caracteres] detalhando pontos fortes, áreas de melhoria, evolução e sugestões construtivas, com tom empático e realista.',
    })
    summary?: string;
}
