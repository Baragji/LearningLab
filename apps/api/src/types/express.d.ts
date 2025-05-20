// apps/api/src/types/express.d.ts

import { User } from '@repo/core';

declare global {
  namespace Express {
    // This extends the Express Request interface to include the user property
    export interface Request {
      user?: User;
    }
  }
}

// This ensures the file is treated as a module
export {};
