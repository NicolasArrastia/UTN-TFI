import { apiRequest } from "./api-client.ts";
import type {
  AuthUser,
  LoginResponse,
  ProfileResponse,
} from "../types/auth.types.ts";

export const authService = {
  login(username: string, password: string): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async getProfile(token: string): Promise<AuthUser> {
    const response = await apiRequest<ProfileResponse>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.user;
  },
};
