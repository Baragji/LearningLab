import { z } from 'zod';
export declare const serverSchema: z.ZodObject<{
    DATABASE_URL: z.ZodOptional<z.ZodString>;
    JWT_SECRET: z.ZodOptional<z.ZodString>;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    SALT_ROUNDS: z.ZodDefault<z.ZodEffects<z.ZodNumber, number, unknown>>;
}, "strip", z.ZodTypeAny, {
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    SALT_ROUNDS?: number;
}, {
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    JWT_EXPIRES_IN?: string;
    SALT_ROUNDS?: unknown;
}>;
export type ServerEnv = z.infer<typeof serverSchema>;
export declare const clientSchema: z.ZodObject<{
    NEXT_PUBLIC_APP_NAME: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_API_URL: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_WS_URL: z.ZodOptional<z.ZodDefault<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    NEXT_PUBLIC_APP_NAME?: string;
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_WS_URL?: string;
}, {
    NEXT_PUBLIC_APP_NAME?: string;
    NEXT_PUBLIC_API_URL?: string;
    NEXT_PUBLIC_WS_URL?: string;
}>;
export type ClientEnv = z.infer<typeof clientSchema>;
export declare const serverEnv: () => Readonly<ServerEnv>;
export declare const clientEnv: () => Readonly<ClientEnv>;
//# sourceMappingURL=env.d.ts.map