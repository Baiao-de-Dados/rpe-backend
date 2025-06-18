import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @Post()
    @ApiOperation({ summary: 'Criar uma nova tag' })
    @ApiResponse({
        status: 201,
        description: 'Tag criada com sucesso',
    })
    create(@Body() createTagDto: CreateTagDto) {
        return this.tagsService.create(createTagDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas as tags' })
    @ApiResponse({
        status: 200,
        description: 'Lista de tags retornada com sucesso',
    })
    findAll() {
        return this.tagsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar uma tag por ID' })
    @ApiResponse({
        status: 200,
        description: 'Tag encontrada com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Tag não encontrada',
    })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.tagsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar uma tag' })
    @ApiResponse({
        status: 200,
        description: 'Tag atualizada com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Tag não encontrada',
    })
    update(@Param('id', ParseIntPipe) id: number, @Body() updateTagDto: UpdateTagDto) {
        return this.tagsService.update(id, updateTagDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Remover uma tag' })
    @ApiResponse({
        status: 200,
        description: 'Tag removida com sucesso',
    })
    @ApiResponse({
        status: 404,
        description: 'Tag não encontrada',
    })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.tagsService.remove(id);
    }
}
