import type { UserRole } from "./auth.types.ts";

export interface Role {
  id: number;
  name: UserRole;
  description: string | null;
  createdAt: string;
}
