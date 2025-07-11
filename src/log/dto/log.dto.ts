import { Log } from '@prisma/client';

export class LogDto implements Log {
    id: number;
    userId: number | null;
    action: string;
    metadata: any;
    createdAt: Date;
}
