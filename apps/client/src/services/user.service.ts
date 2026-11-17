import type { AuthUser, UserRole } from "../types/auth.types.ts";
import { authenticatedRequest } from "./api-client.ts";

export interface CreateUserPayload {
  fullname: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  fullname?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}

interface CreateUserResponse {
  user: AuthUser;
}

interface UsersResponse {
  users: AuthUser[];
}

export const userService = {
  async list(includeInactive: boolean, signal?: AbortSignal): Promise<AuthUser[]> {
    const query = includeInactive ? "?includeInactive=true" : "";
    const response = await authenticatedRequest<UsersResponse>(
      `/users${query}`,
      { signal },
    );

    return response.users;
  },

  async create(payload: CreateUserPayload): Promise<AuthUser> {
    const response = await authenticatedRequest<CreateUserResponse>("/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return response.user;
  },

  async update(id: number, payload: UpdateUserPayload): Promise<AuthUser> {
    const response = await authenticatedRequest<CreateUserResponse>(
      `/users/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    return response.user;
  },

  async remove(id: number): Promise<AuthUser> {
    const response = await authenticatedRequest<CreateUserResponse>(
      `/users/${id}`,
      {
        method: "DELETE",
      },
    );

    return response.user;
  },
};
