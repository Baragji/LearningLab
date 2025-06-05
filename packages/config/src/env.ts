// packages/config/src/env.ts
import { z } from "zod";

/**
 * Definerer skemaet for server-side miljøvariabler.
 */
export const serverSchema = z.object({
  // Database
  DATABASE_URL: z
    .string()
    .url({ message: "DATABASE_URL skal være en gyldig URL." }),

  // Server Configuration
  PORT: z.string().regex(/^\d+$/, "PORT skal være et tal").default("5002"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Authentication
  JWT_SECRET: z
    .string()
    .min(32, { message: "JWT_SECRET skal være mindst 32 tegn lang." }),
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, { message: "JWT_REFRESH_SECRET skal være mindst 32 tegn lang." }),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  SALT_ROUNDS: z
    .preprocess(
      (val) =>
        typeof val === "string"
          ? parseInt(val, 10)
          : typeof val === "number"
            ? val
            : undefined,
      z
        .number({ invalid_type_error: "SALT_ROUNDS skal være et tal." })
        .int()
        .positive({ message: "SALT_ROUNDS skal være et positivt heltal." }),
    )
    .default(10),

  // CORS Configuration
  CORS_ORIGINS: z.string().optional(),

  // Social Authentication (Optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),

  // Rate Limiting
  THROTTLE_TTL: z
    .string()
    .regex(/^\d+$/, "THROTTLE_TTL skal være et tal")
    .default("60000"),
  THROTTLE_LIMIT: z
    .string()
    .regex(/^\d+$/, "THROTTLE_LIMIT skal være et tal")
    .default("10"),

  // Cache Configuration
  CACHE_TTL: z
    .string()
    .regex(/^\d+$/, "CACHE_TTL skal være et tal")
    .default("60"),
  CACHE_MAX_ITEMS: z
    .string()
    .regex(/^\d+$/, "CACHE_MAX_ITEMS skal være et tal")
    .default("100"),

  // Logging
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "debug", "verbose"])
    .default("debug"),

  // API Documentation
  SWAGGER_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((val) => val === "true"),

  // File Upload (Optional)
  MAX_FILE_SIZE: z
    .string()
    .regex(/^\d+$/, "MAX_FILE_SIZE skal være et tal")
    .default("10485760"),
  UPLOAD_DESTINATION: z.string().default("./uploads"),
});
export type ServerEnv = z.infer<typeof serverSchema>;

/**
 * Definerer skemaet for client-side (public) miljøvariabler.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Læringsplatform"),
  NEXT_PUBLIC_API_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_API_URL skal være en gyldig URL." })
    .default("http://localhost:5002/api"),
  NEXT_PUBLIC_WS_URL: z
    .string()
    .url({ message: "NEXT_PUBLIC_WS_URL skal være en gyldig URL." })
    .default("http://localhost:3001")
    .optional(),
  NEXT_PUBLIC_GITHUB_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().optional(),
  NEXT_PUBLIC_ENABLE_NEW_FEATURES: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
});
export type ClientEnv = z.infer<typeof clientSchema>;

let memoizedServerEnv: ServerEnv;
let memoizedClientEnv: ClientEnv;

function parseServerEnv(): ServerEnv {
  const source = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    SALT_ROUNDS: process.env.SALT_ROUNDS,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL,
    THROTTLE_TTL: process.env.THROTTLE_TTL,
    THROTTLE_LIMIT: process.env.THROTTLE_LIMIT,
    CACHE_TTL: process.env.CACHE_TTL,
    CACHE_MAX_ITEMS: process.env.CACHE_MAX_ITEMS,
    LOG_LEVEL: process.env.LOG_LEVEL,
    SWAGGER_ENABLED: process.env.SWAGGER_ENABLED,
    MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
    UPLOAD_DESTINATION: process.env.UPLOAD_DESTINATION,
  };

  // In CI/CD or build environments, we don't need to validate all environment variables
  if (
    process.env.CI ||
    (process.env.NODE_ENV === "production" &&
      process.env.SKIP_ENV_VALIDATION === "true")
  ) {
    return serverSchema.parse({
      ...source,
      DATABASE_URL:
        source.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy",
      JWT_SECRET:
        source.JWT_SECRET ||
        "dummy_secret_key_for_build_environment_only_32chars",
      JWT_REFRESH_SECRET:
        source.JWT_REFRESH_SECRET ||
        "dummy_refresh_secret_key_for_build_environment_32",
    });
  }

  const parsed = serverSchema.safeParse(source);

  if (!parsed.success) {
    console.error(
      "❌ Ugyldige server-side miljøvariabler:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error(
      "Ugyldige server-side miljøvariabler. Tjek .env filen og konsollen.",
    );
  }
  return parsed.data;
}

function parseClientEnv(): ClientEnv {
  const source = {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
    NEXT_PUBLIC_ENABLE_NEW_FEATURES:
      process.env.NEXT_PUBLIC_ENABLE_NEW_FEATURES,
  };

  const parsed = clientSchema.safeParse(source);

  if (!parsed.success) {
    console.error(
      "❌ Ugyldige client-side miljøvariabler:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error(
      "Ugyldige client-side miljøvariabler. Tjek .env filen og konsollen.",
    );
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
  if (!memoizedClientEnv) {
    memoizedClientEnv = parseClientEnv();
  }
  return memoizedClientEnv;
};

// Initialiser og valider server-miljøvariabler ved modul-load.
// Only validate if we're in a server environment
if (typeof window === "undefined") {
  try {
    serverEnv();
    // console.log('✅ Server-miljøvariabler valideret og indlæst.');
  } catch (error) {
    // In CI/CD or build environments, we don't need to validate all environment variables
    if (process.env.CI || process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️ Kører i CI/CD eller produktionsmiljø, springer over streng miljøvariabel-validering",
      );
    } else {
      console.error("❌ Fejl ved validering af server-miljøvariabler:", error);
      process.exit(1);
    }
  }
}
