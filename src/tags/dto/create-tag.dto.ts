import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTagDto {
    @ApiProperty({
        example: 'Frontend',
        description: 'Nome da tag',
    })
    @IsString()
    name: string;
}
