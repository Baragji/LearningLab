import { z } from 'zod';

export const userSettingsSchema = z.object({
  notifications: z.object({
    email: z.boolean().default(true),
    browser: z.boolean().default(true),
  }),
  privacy: z.object({
    showProfile: z.boolean().default(true),
    showProgress: z.boolean().default(false),
  }),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  // Add other settings as needed
});

export type UserSettings = z.infer<typeof userSettingsSchema>;
