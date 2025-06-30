import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { CreateUserDTO } from 'src/user/dto/create-user.dto';
import { gerarEmail, gerarNome } from './user-import.util';

@Injectable()
export class UserImportService {
    async parseExcel(buffer: Buffer): Promise<CreateUserDTO[]> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.getWorksheet(1);
        const dtos: CreateUserDTO[] = [];
        const emails = new Set<string>();

        sheet?.eachRow((row, index) => {
            if (index === 1) return;
            const values = Array.isArray(row.values) ? row.values : [];
            let email = values[1] as string;
            const name = values[3] as string;
            const password = values[2] as string;
            const position = values[4] as string;
            const track = values[5] as string;
            const unit = values[6] as string;
            const role = values[7] as string;

            // Preenchimento com as utils @markfranca @viictorpaes
            if (!email && name) email = gerarEmail(name);
            if (!name && email) email = gerarNome(email);

            if (!email || !password || !name || !position || !track || !unit || !role) return;

            if (emails.has(email)) return;
            emails.add(email);

            dtos.push({ email, password, name, position, track, unit, role } as CreateUserDTO);
        });
        return dtos;
    }
}
