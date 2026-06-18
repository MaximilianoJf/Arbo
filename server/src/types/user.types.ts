
export interface User {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

declare global {
    namespace Express {
        interface Request {
            email?: string;
        }
    }
}

export interface Login extends Pick<User, 'email' | 'password'> { }

export interface Register extends Pick<User, 'email' | 'password' | 'name'> { }