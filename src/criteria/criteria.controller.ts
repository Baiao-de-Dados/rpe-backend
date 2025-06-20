import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CriteriaService } from './criteria.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { UserRoleEnum } from '@prisma/client';
import {
    ApiCreate,
    ApiUpdate,
    ApiGet,
    ApiList,
    ApiDelete,
} from 'src/common/decorators/api-crud.decorator';

@ApiTags('Critérios')
@Controller('criteria')
export class CriteriaController {
    constructor(private readonly criteriaService: CriteriaService) {}

    @Post()
    @ExactRoles(UserRoleEnum.RH)
    @ApiCreate('critério')
    create(@Body() createCriterionDto: CreateCriterionDto) {
        return this.criteriaService.create(createCriterionDto);
    }

    @Get()
    @ExactRoles(UserRoleEnum.RH)
    @ApiList('critérios')
    findAll() {
        return this.criteriaService.findAll();
    }

    @Get('pillar/:pillarId')
    @ExactRoles(UserRoleEnum.RH)
    @ApiGet('critérios por pilar')
    findByPillar(@Param('pillarId', ParseIntPipe) pillarId: number) {
        return this.criteriaService.findByPillar(pillarId);
    }

    @Get(':id')
    @ExactRoles(UserRoleEnum.RH)
    @ApiGet('critério')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.criteriaService.findOne(id);
    }

    @Patch(':id')
    @ExactRoles(UserRoleEnum.RH)
    @ApiUpdate('critério')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateCriterionDto: UpdateCriterionDto) {
        return this.criteriaService.update(id, updateCriterionDto);
    }

    @Delete(':id')
    @ExactRoles(UserRoleEnum.RH)
    @ApiDelete('critério')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.criteriaService.remove(id);
    }
}
