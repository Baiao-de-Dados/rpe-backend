import { PartialType } from '@nestjs/swagger';
import { CreatePillarDto } from './create-pillar.dto';

export class UpdatePillarDto extends PartialType(CreatePillarDto) {}
