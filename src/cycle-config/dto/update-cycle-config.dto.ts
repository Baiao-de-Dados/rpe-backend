import { PartialType } from '@nestjs/swagger';
import { CreateCycleConfigDto } from './create-cycle-config.dto';

export class UpdateCycleConfigDto extends PartialType(CreateCycleConfigDto) {}
