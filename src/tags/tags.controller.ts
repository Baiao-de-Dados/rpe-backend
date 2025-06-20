import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { ApiCreate, ApiDelete, ApiGet, ApiUpdate } from 'src/common/decorators/api-crud.decorator';

@ApiTags('Tags')
@ApiAuth()
@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @Post()
    @ApiCreate('tag')
    create(@Body() createTagDto: CreateTagDto) {
        return this.tagsService.create(createTagDto);
    }

    @Get()
    @ApiCreate('tags')
    findAll() {
        return this.tagsService.findAll();
    }

    @Get(':id')
    @ApiGet('tag')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.tagsService.findOne(id);
    }

    @Patch(':id')
    @ApiUpdate('tag')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateTagDto: UpdateTagDto) {
        return this.tagsService.update(id, updateTagDto);
    }

    @Delete(':id')
    @ApiDelete('tag')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.tagsService.remove(id);
    }
}
