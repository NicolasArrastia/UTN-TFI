import type { AuthTokenPayload } from "./auth.types.ts";

declare global {
  namespace Express {
    interface Request {
      auth?: AuthTokenPayload;
    }
  }
}

export {};
