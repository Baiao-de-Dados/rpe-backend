import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEvaluationDto } from './create-evaluation.dto';

describe('CreateEvaluationDto', () => {
    describe('validation', () => {
        it('should pass validation with valid data', async () => {
            // Arrange
            const validDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [
                    {
                        avaliadoId: '2',
                        pontosFortes: 'Ótima comunicação',
                        pontosMelhoria: 'Precisa melhorar prazos',
                        justificativa: 'Avaliação baseada no trabalho em equipe',
                    },
                ],
                mentoring: [
                    {
                        mentorId: '3',
                        justificativa: 'Acompanhamento semanal',
                        leaderId: '4',
                        leaderJustificativa: 'Avaliação do líder',
                    },
                ],
                referencias: [
                    {
                        colaboradorId: '2',
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
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
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
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
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
                colaboradorId: '1',
                avaliacao360: [],
                mentoring: [],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.some((e) => e.property === 'autoavaliacao')).toBe(true);
        });

        it('should fail validation when criterioId is not a string', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: 1, // Invalid type
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
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
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
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
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

        it('should pass validation with empty arrays', async () => {
            // Arrange
            const validDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: {},
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
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [
                    {
                        avaliadoId: '2',
                        justificativa: 'Avaliação baseada no trabalho em equipe',
                    },
                ],
                mentoring: {},
                referencias: [],
            });

            // Act
            const errors = await validate(validDto);

            // Assert
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only leader field', async () => {
            // Arrange
            const validDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [
                    {
                        mentorId: '', // required by DTO, but not used for leader
                        justificativa: '', // required by DTO, but not used for leader
                        leaderId: '4',
                        leaderJustificativa: 'Avaliação do líder',
                    },
                ],
                referencias: [],
            });

            // Act
            const errors = await validate(validDto);

            // Assert
            expect(errors).toHaveLength(0);
        });

        it('should pass validation with only mentoring field', async () => {
            // Arrange
            const validDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [
                    {
                        mentorId: '3',
                        justificativa: 'Acompanhamento semanal',
                    },
                ],
                referencias: [],
            });

            // Act
            const errors = await validate(validDto);

            // Assert
            expect(errors).toHaveLength(0);
        });

        it('should fail validation when leader.leaderId is not a string', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [
                    {
                        leaderId: 4, // Invalid type
                        leaderJustificativa: 'Avaliação do líder',
                    },
                ],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should fail validation when mentoring.mentorId is not a string', async () => {
            // Arrange
            const invalidDto = plainToInstance(CreateEvaluationDto, {
                ciclo: '2024-Q1',
                colaboradorId: '1',
                autoavaliacao: {
                    pilares: [
                        {
                            pilarId: '1',
                            criterios: [
                                {
                                    criterioId: '1',
                                    nota: 8,
                                    justificativa: 'Bom domínio técnico',
                                },
                            ],
                        },
                    ],
                },
                avaliacao360: [],
                mentoring: [
                    {
                        mentorId: 4, // Invalid type
                        justificativa: 'Acompanhamento semanal',
                    },
                ],
                referencias: [],
            });

            // Act
            const errors = await validate(invalidDto);

            // Assert
            expect(errors.length).toBeGreaterThan(0);
        });
    });
});
