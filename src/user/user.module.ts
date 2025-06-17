import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module'; // Importe o PrismaModule

@Module({
    imports: [PrismaModule], // Adicione o PrismaModule aqui
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService], // Se outros módulos precisarem do UserService
})
export class UserModule {}
