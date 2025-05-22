import { registerAs } from '@nestjs/config';

export default registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10), // Default: 1 minute
  limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10), // Default: 10 requests per TTL
}));
