import { PartialType } from '@nestjs/swagger';
import { CreateCriterionDto } from './create-criterion.dto';

export class UpdateCriterionDto extends PartialType(CreateCriterionDto) {}
