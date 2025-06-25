import { ApiProperty } from '@nestjs/swagger';

export class SetConfigDto {
    @ApiProperty()
    key: string;

    @ApiProperty()
    value: string;

    @ApiProperty({ required: false })
    description?: string;
}
