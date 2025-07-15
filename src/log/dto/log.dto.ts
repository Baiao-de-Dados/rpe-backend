import { Log } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsIn, IsInt } from 'class-validator';

export class LogDto implements Log {
    id: number;
    userId: number | null;
    action: string;
    metadata: any;
    createdAt: Date;
}

export class FindLogsQueryDto {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    pageSize?: number;

    @IsOptional()
    @IsString()
    action?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    dateFrom?: string; // ou Date

    @IsOptional()
    @IsString()
    dateTo?: string; // ou Date

    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc';
}
