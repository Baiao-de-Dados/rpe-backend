import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @ApiOperation({ summary: 'Realizar login' })
    @ApiResponse({
        status: 200,
        description: 'Login realizado com sucesso',
        type: LoginResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
    async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
        try {
            return await this.authService.login(loginDto.email, loginDto.password);
        } catch {
            throw new UnauthorizedException('Credenciais inválidas');
        }
    }

    @Post('register')
    @ApiOperation({ summary: 'Registrar novo usuário' })
    @ApiResponse({
        status: 201,
        description: 'Usuário registrado com sucesso',
    })
    @ApiResponse({ status: 401, description: 'Email já existe' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto.email, registerDto.password, registerDto.name);
    }
}
