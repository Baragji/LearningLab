// apps/api/src/config/social-auth.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('socialAuth', () => ({
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/auth/google/callback',
    scope: ['email', 'profile'],
  },
  github: {
    clientID: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    callbackURL:
      process.env.GITHUB_CALLBACK_URL ||
      'http://localhost:3000/api/auth/github/callback',
    scope: ['user:email'],
  },
  // Frontend URL til redirect efter succesfuld login
  frontendURL: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
