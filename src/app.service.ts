import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service'; // Adjust the import path as necessary

@Injectable()
export class AppService {
    constructor(private prisma: PrismaService) {}

    getHello(): string {
        return 'Hello World!';
    }

    async getUsers() {
        return this.prisma.user.findMany();
    }
}
