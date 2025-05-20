export declare enum Role {
    USER = "USER",
    ADMIN = "ADMIN"
}
export interface User {
    id: number;
    email: string;
    name?: string | null;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=user.types.d.ts.map