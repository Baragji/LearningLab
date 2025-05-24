import { z } from 'zod';

export const socialLinksSchema = z.object({
  twitter: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  website: z.string().url().optional(),
  // Add other social platforms as needed
});

export type SocialLinks = z.infer<typeof socialLinksSchema>;