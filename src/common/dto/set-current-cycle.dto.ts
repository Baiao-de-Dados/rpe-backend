import { ApiProperty } from '@nestjs/swagger';

export class SetCurrentCycleDto {
    @ApiProperty()
    cycle: string;
}
