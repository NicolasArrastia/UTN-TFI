import type { AuthUser, UserRole } from "../types/auth.types.ts";
import { authenticatedRequest } from "./api-client.ts";

export interface CreateUserPayload {
  fullname: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

interface CreateUserResponse {
  user: AuthUser;
}

export const userService = {
  async create(payload: CreateUserPayload): Promise<AuthUser> {
    const response = await authenticatedRequest<CreateUserResponse>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return response.user;
  },
};
