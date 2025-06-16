export class RegisterDTO {
    email!: string;
    password!: string;
    name?: string;
}

export class LoginDTO {
    email!: string;
    password!: string;
}
