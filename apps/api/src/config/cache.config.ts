import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
  ttl: parseInt(process.env.CACHE_TTL || '60', 10), // Default: 60 seconds
  max: parseInt(process.env.CACHE_MAX_ITEMS || '100', 10), // Default: 100 items
}));
