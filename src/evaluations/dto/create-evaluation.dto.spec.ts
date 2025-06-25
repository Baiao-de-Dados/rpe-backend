import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEvaluationDto } from './create-evaluation.dto';

describe('CreateEvaluationDto', () => {
    describe('validation', () => {
        it('should pass validation with valid data', async () => {
            // Arrange
            const validDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: 1,
                autoavaliacao: {
                    justificativa: 'Autoavaliação geral do período',
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 1,
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [
                    {
                        avaliadoId: 2,
                        pontosFortes: 'Ótima comunicação',
                        pontosMelhoria: 'Precisa melhorar prazos',
                        justificativa: 'Avaliação baseada no trabalho em equipe',
                    },
                ],
                mentoring: {
                    mentorId: 2,
                    justificativa: 'Acompanhamento semanal',
                },
                referencias: [
                    {
                        colaboradorId: 2,
                        justificativa: 'Referência técnica',
                        tagIds: [1],
                    },
                ],
            });

            // Act
            const errors = await validate(validDto);

            // Assert
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when ciclo is missing', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                colaboradorId: 1,
                autoavaliacao: {
                    justificativa: 'Autoavaliação geral do período',
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 1,
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.some((e) => e.property === 'ciclo')).toBe(true);
        });

        it('should fail validation when colaboradorId is missing', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                autoavaliacao: {
                    justificativa: 'Autoavaliação geral do período',
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 1,
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.some((e) => e.property === 'colaboradorId')).toBe(true);
        });

        it('should fail validation when autoavaliacao is missing', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: 1,
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.some((e) => e.property === 'autoavaliacao')).toBe(true);
        });

        it('should fail validation when autoavaliacao.justificativa is missing', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: 1,
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 1,
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.some((e) => e.property === 'autoavaliacao')).toBe(true);
        });

        it('should fail validation when criterioId is not a number', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: 1,
                autoavaliacao: {
                    justificativa: 'Autoavaliação geral do período',
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 'invalid', // Invalid type
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should fail validation when criterio.nota is missing', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: 1,
                autoavaliacao: {
                    justificativa: 'Autoavaliação geral do período',
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 1,
                                    justificativa: 'Bom domínio técnico',
                                    // nota is missing
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should fail validation when criterio.justificativa is missing', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: 1,
                autoavaliacao: {
                    justificativa: 'Autoavaliação geral do período',
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 1,
                                    nota: 8,
                                    // justificativa is missing
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should fail validation when criterio.nota is not a number', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: 1,
                autoavaliacao: {
                    justificativa: 'Autoavaliação geral do período',
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 1,
                                    nota: 'invalid', // Invalid type
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should pass validation with empty arrays', async () => {
            // Arrange
            const validDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: 1,
                autoavaliacao: {
                    justificativa: 'Autoavaliação geral do período',
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 1,
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(validDto);

            // Assert
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with optional fields in avaliacao360', async () => {
            // Arrange
            const validDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: 1,
                autoavaliacao: {
                    justificativa: 'Autoavaliação geral do período',
                    pilares: [
                        {
                            pilarId: 1,
                            criterios: [
                                {
                                    criterioId: 1,
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [
                    {
                        avaliadoId: 2,
                        // pontosFortes and pontosMelhoria are optional
                        justificativa: 'Avaliação baseada no trabalho em equipe',
                    },
                ],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(validDto);

            // Assert
            expect(errors).toHaveLength(0);
        });
    });
});
