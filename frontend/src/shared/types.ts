export interface User {
    id: string;
    name: string;
    email?: string;
}

export interface GlossToken {
    word: string;
    timestamp?: number;
}
