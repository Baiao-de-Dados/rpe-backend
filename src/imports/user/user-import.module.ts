import { Module } from '@nestjs/common';
import { UserImportService } from './user-import.service';

@Module({
    providers: [UserImportService],
    exports: [UserImportService],
})
export class UserImportModule {}
