import { PartialType } from '@nestjs/swagger';
import { CreatePillarTrackConfigDto } from './create-pillar-track-config.dto';

export class UpdatePillarTrackConfigDto extends PartialType(CreatePillarTrackConfigDto) {}
