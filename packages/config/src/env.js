"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientEnv = exports.serverEnv = exports.clientSchema = exports.serverSchema = void 0;
const zod_1 = require("zod");
exports.serverSchema = zod_1.z.object({
    DATABASE_URL: zod_1.z.string().url({ message: "DATABASE_URL skal være en gyldig URL." }).optional(),
    JWT_SECRET: zod_1.z.string().min(32, { message: "JWT_SECRET skal være mindst 32 tegn lang." }).optional(),
    JWT_EXPIRES_IN: zod_1.z.string().default('1h'),
    SALT_ROUNDS: zod_1.z.preprocess((val) => (typeof val === 'string' ? parseInt(val, 10) : typeof val === 'number' ? val : undefined), zod_1.z.number({ invalid_type_error: "SALT_ROUNDS skal være et tal." }).int().positive({ message: "SALT_ROUNDS skal være et positivt heltal." })).default(10),
});
exports.clientSchema = zod_1.z.object({
    NEXT_PUBLIC_APP_NAME: zod_1.z.string().default('Læringsplatform'),
    NEXT_PUBLIC_API_URL: zod_1.z.string().url({ message: "NEXT_PUBLIC_API_URL skal være en gyldig URL." }).default('http://localhost:5002/api'),
    NEXT_PUBLIC_WS_URL: zod_1.z.string().url({ message: "NEXT_PUBLIC_WS_URL skal være en gyldig URL." }).default('http://localhost:3001').optional(),
});
let memoizedServerEnv;
let memoizedClientEnv;
function parseServerEnv() {
    const source = {
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
        SALT_ROUNDS: process.env.SALT_ROUNDS,
    };
    if (process.env.CI || process.env.NODE_ENV === 'production') {
        return {
            DATABASE_URL: source.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy',
            JWT_SECRET: source.JWT_SECRET || 'dummy_secret_key_for_build_environment_only_32chars',
            JWT_EXPIRES_IN: source.JWT_EXPIRES_IN || '15m',
            SALT_ROUNDS: source.SALT_ROUNDS ? parseInt(source.SALT_ROUNDS, 10) : 10,
        };
    }
    const parsed = exports.serverSchema.safeParse(source);
    if (!parsed.success) {
        console.error('❌ Ugyldige server-side miljøvariabler:', parsed.error.flatten().fieldErrors);
        throw new Error('Ugyldige server-side miljøvariabler. Tjek .env filen og konsollen.');
    }
    return parsed.data;
}
function parseClientEnv() {
    const source = {
        NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    };
    const parsed = exports.clientSchema.safeParse(source);
    if (process.env.CI || process.env.NODE_ENV === 'production') {
        return exports.clientSchema.parse({
            NEXT_PUBLIC_APP_NAME: source.NEXT_PUBLIC_APP_NAME || 'Læringsplatform',
            NEXT_PUBLIC_API_URL: source.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api',
            NEXT_PUBLIC_WS_URL: source.NEXT_PUBLIC_WS_URL || 'http://localhost:3001',
        });
    }
    if (!parsed.success) {
        console.error('❌ Ugyldige client-side miljøvariabler:', parsed.error.flatten().fieldErrors);
        throw new Error('Ugyldige client-side miljøvariabler. Tjek .env filen og konsollen.');
    }
    return parsed.data;
}
const serverEnv = () => {
    if (!memoizedServerEnv) {
        memoizedServerEnv = parseServerEnv();
    }
    return memoizedServerEnv;
};
exports.serverEnv = serverEnv;
const clientEnv = () => {
    if (!memoizedClientEnv) {
        memoizedClientEnv = parseClientEnv();
    }
    return memoizedClientEnv;
};
exports.clientEnv = clientEnv;
try {
    (0, exports.serverEnv)();
}
catch (error) {
    if (process.env.CI || process.env.NODE_ENV === 'production') {
        console.warn('⚠️ Kører i CI/CD eller produktionsmiljø, springer over streng miljøvariabel-validering');
    }
    else {
        console.error('❌ Fejl ved validering af server-miljøvariabler:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=env.js.map