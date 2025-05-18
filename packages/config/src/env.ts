// packages/config/src/env.ts
import { z } from 'zod';

/**
 * Definerer skemaet for server-side miljøvariabler.
 * Brug .server() for at sikre, at disse ikke utilsigtet inkluderes i client-side bundles.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().url({ message: "DATABASE_URL skal være en gyldig URL." }),
  JWT_SECRET: z.string().min(32, { message: "JWT_SECRET skal være mindst 32 tegn lang." }),
  JWT_EXPIRES_IN: z.string().default('1h'), // Default værdi hvis ikke sat
  // NODE_ENV: z.enum(['development', 'production', 'test']).default('development'), // Eksempel
});

/**
 * Definerer skemaet for client-side (public) miljøvariabler.
 * Disse skal prefixxes med NEXT_PUBLIC_ for Next.js applikationer.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Læringsplatform'),
  NEXT_PUBLIC_WS_URL: z.string().url({ message: "NEXT_PUBLIC_WS_URL skal være en gyldig URL." }).default('http://localhost:3001'),
  // Tilføj andre NEXT_PUBLIC_ variabler her efter behov
});

/**
 * Miljøvariabler, der er tilgængelige for både server og client.
 * Dette er typisk ikke anbefalet for følsomme variabler.
 * For Next.js, er det bedre at adskille dem klart.
 * Hvis en variabel skal bruges på både server og client (og ikke er følsom),
 * kan den defineres her eller i clientSchema (hvis public) og serverSchema (hvis server).
 */
// const sharedSchema = z.object({
//   // F.eks. en feature flag der kan læses af begge
// });


/**
 * Validerer og parser server-side miljøvariabler.
 * Kaster en fejl ved build/runtime hvis validering fejler.
 */
const parsedServerEnv = serverSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  // NODE_ENV: process.env.NODE_ENV,
});

if (!parsedServerEnv.success) {
  console.error(
    '❌ Ugyldige server-side miljøvariabler:',
    parsedServerEnv.error.flatten().fieldErrors,
  );
  // I et produktionsmiljø bør applikationen ikke starte med ugyldige env vars.
  // I udvikling kan man overveje at kaste fejlen for at stoppe processen.
  throw new Error('Ugyldige server-side miljøvariabler. Tjek .env filen og konsollen.');
}
export const serverEnv = parsedServerEnv.data;


/**
 * Validerer og parser client-side miljøvariabler.
 * For Next.js hentes disse typisk direkte via process.env.NEXT_PUBLIC_XXX i client-koden,
 * men at have et skema her hjælper med central definition og type-sikkerhed.
 * For at gøre disse typer globalt tilgængelige i Next.js client-side kode uden import,
 * kan man udvide NodeJS.ProcessEnv interfacet (se Next.js dokumentation).
 */
const parsedClientEnv = clientSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
});

if (!parsedClientEnv.success) {
  console.error(
    '❌ Ugyldige client-side miljøvariabler:',
    parsedClientEnv.error.flatten().fieldErrors,
  );
  // Overvej at kaste en fejl her også, især under build-processen.
  throw new Error('Ugyldige client-side miljøvariabler. Tjek .env filen og konsollen.');
}
export const clientEnv = parsedClientEnv.data;

/**
 * Samlet objekt for alle miljøvariabler (kan være nyttigt i nogle sammenhænge,
 * men adskillelsen af serverEnv og clientEnv er ofte mere sikker og klar).
 */
export const env = {
  ...serverEnv,
  ...clientEnv,
  // ...parsedSharedEnv.data, // Hvis sharedSchema bruges
};

console.log('✅ Miljøvariabler valideret og indlæst.');

