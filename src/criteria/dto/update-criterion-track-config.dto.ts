import { PartialType } from '@nestjs/swagger';
import { CreateCriterionTrackConfigDto } from './create-criterion-track-config.dto';

export class UpdateCriterionTrackConfigDto extends PartialType(CreateCriterionTrackConfigDto) {}
