import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginResponse } from './interfaces/login-response.interface';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body() body: { email: string; password: string }): Promise<LoginResponse> {
        try {
            return await this.authService.login(body.email, body.password);
        } catch {
            throw new UnauthorizedException('Invalid credentials');
        }
    }

    @Post('register')
    async register(@Body() body: { email: string; password: string; name?: string }) {
        return this.authService.register(body.email, body.password, body.name);
    }
}
