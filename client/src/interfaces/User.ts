export interface LoginData {
    email: string;
    password?: string;
}

export interface UserProfile {
    id: number;
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'user';
    token: string;
}

