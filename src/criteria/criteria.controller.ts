import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CriteriaService } from './criteria.service';
import { CreateCriterionDto } from './dto/create-criterion.dto';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { ExactRoles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
    ApiCreate,
    ApiUpdate,
    ApiGet,
    ApiList,
    ApiDelete,
} from 'src/common/decorators/api-crud.decorator';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';

@ApiTags('Critérios')
@ApiAuth()
@Controller('criteria')
export class CriteriaController {
    constructor(private readonly criteriaService: CriteriaService) {}

    @Post()
    @ExactRoles(UserRole.RH)
    @ApiCreate('critério')
    create(@Body() createCriterionDto: CreateCriterionDto) {
        return this.criteriaService.create(createCriterionDto);
    }

    @Get()
    @ExactRoles(UserRole.RH)
    @ApiList('critérios')
    findAll() {
        return this.criteriaService.findAll();
    }

    @Get('pillar/:pillarId')
    @ExactRoles(UserRole.RH)
    @ApiGet('critérios por pilar')
    findByPillar(@Param('pillarId', ParseIntPipe) pillarId: number) {
        return this.criteriaService.findByPillar(pillarId);
    }

    @Get(':id')
    @ExactRoles(UserRole.RH)
    @ApiGet('critério')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.criteriaService.findOne(id);
    }

    @Patch(':id')
    @ExactRoles(UserRole.RH)
    @ApiUpdate('critério')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateCriterionDto: UpdateCriterionDto) {
        return this.criteriaService.update(id, updateCriterionDto);
    }

    @Delete(':id')
    @ExactRoles(UserRole.RH)
    @ApiDelete('critério')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.criteriaService.remove(id);
    }
}
