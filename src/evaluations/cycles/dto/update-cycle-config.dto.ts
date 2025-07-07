import { PartialType } from '@nestjs/swagger';
import { CreateCycleConfigDto } from 'src/evaluations/cycles/dto/create-cycle-config.dto';

export class UpdateCycleConfigDto extends PartialType(CreateCycleConfigDto) {}
