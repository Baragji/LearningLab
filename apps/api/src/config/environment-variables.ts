import * as Joi from 'joi';

export interface EnvironmentVariables {
  // Database
  DATABASE_URL: string;

  // Server
  PORT: string;
  NODE_ENV: string;

  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // CORS
  CORS_ORIGINS: string;
}

export const validationSchemaForEnv = Joi.object<EnvironmentVariables, true>({
  // Database
  DATABASE_URL: Joi.string().required(),

  // Server
  PORT: Joi.string().default('5002'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Authentication
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // CORS
  CORS_ORIGINS: Joi.string().default(
    'http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3007',
  ),
});
