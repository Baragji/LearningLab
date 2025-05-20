// packages/config/src/env.ts
import { z } from 'zod';

/**
 * Definerer skemaet for server-side miljøvariabler.
 */
export const serverSchema = z.object({
  DATABASE_URL: z.string().url({ message: "DATABASE_URL skal være en gyldig URL." }),
  JWT_SECRET: z.string().min(32, { message: "JWT_SECRET skal være mindst 32 tegn lang." }),
  JWT_EXPIRES_IN: z.string().default('1h'),
  SALT_ROUNDS: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : typeof val === 'number' ? val : undefined),
    z.number({ invalid_type_error: "SALT_ROUNDS skal være et tal."}).int().positive({ message: "SALT_ROUNDS skal være et positivt heltal."})
  ).default(10),
  // NODE_ENV: z.enum(['development', 'production', 'test']).default('development'), // Valgfri
});
export type ServerEnv = z.infer<typeof serverSchema>;

/**
 * Definerer skemaet for client-side (public) miljøvariabler.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Læringsplatform'),
  NEXT_PUBLIC_API_URL: z.string().url({ message: "NEXT_PUBLIC_API_URL skal være en gyldig URL."}).default('http://localhost:5002/api'),
  NEXT_PUBLIC_WS_URL: z.string().url({ message: "NEXT_PUBLIC_WS_URL skal være en gyldig URL." }).default('http://localhost:3001'),
});
export type ClientEnv = z.infer<typeof clientSchema>;

let memoizedServerEnv: ServerEnv;
let memoizedClientEnv: ClientEnv;

function parseServerEnv(): ServerEnv {
  const source = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    SALT_ROUNDS: process.env.SALT_ROUNDS,
    // NODE_ENV: process.env.NODE_ENV,
  };
  const parsed = serverSchema.safeParse(source);

  if (!parsed.success) {
    console.error(
      '❌ Ugyldige server-side miljøvariabler:',
      parsed.error.flatten().fieldErrors,
    );
    throw new Error('Ugyldige server-side miljøvariabler. Tjek .env filen og konsollen.');
  }
  return parsed.data;
}

function parseClientEnv(): ClientEnv {
   const source = {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  };
  const parsed = clientSchema.safeParse(source);

  if (!parsed.success) {
    console.error(
      '❌ Ugyldige client-side miljøvariabler:',
      parsed.error.flatten().fieldErrors,
    );
    throw new Error('Ugyldige client-side miljøvariabler. Tjek .env filen og konsollen.');
  }
  return parsed.data;
}

export const serverEnv = (): Readonly<ServerEnv> => {
  if (!memoizedServerEnv) {
    memoizedServerEnv = parseServerEnv();
  }
  return memoizedServerEnv;
};

export const clientEnv = (): Readonly<ClientEnv> => {
  if(!memoizedClientEnv) {
    memoizedClientEnv = parseClientEnv();
  }
  return memoizedClientEnv;
}

// Initialiser og valider server-miljøvariabler ved modul-load.
try {
  serverEnv();
  // console.log('✅ Server-miljøvariabler valideret og indlæst.');
} catch (error) {
  console.error('❌ Fejl ved validering af server-miljøvariabler:', error);
  process.exit(1);
}
