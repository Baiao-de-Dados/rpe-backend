import { ApiGet, ApiList } from 'src/common/decorators/api-crud.decorator';
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { RequireRH } from 'src/auth/decorators/roles.decorator';
import { RHUserService } from '../services/rh.service';
import { ApiTags } from '@nestjs/swagger';
import { RHUserDTO } from '../dto/rh.dto';

@ApiTags('Usuários RH')
@ApiAuth()
@Controller('rh/users')
export class RHUserController {
    constructor(private readonly rhUserService: RHUserService) {}

    @RequireRH()
    @Get()
    @ApiList('usuários RH')
    async findAll(): Promise<RHUserDTO[]> {
        return this.rhUserService.findAll();
    }

    @RequireRH()
    @Get(':id')
    @ApiGet('usuário RH')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<RHUserDTO> {
        return this.rhUserService.findOne(id);
    }
}
