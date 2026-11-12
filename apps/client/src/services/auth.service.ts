import { apiRequest, authenticatedRequest } from "./api-client.ts";
import type {
  AuthUser,
  LoginResponse,
  ProfileResponse,
} from "../types/auth.types.ts";

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

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

  changePassword(
    payload: ChangePasswordPayload,
  ): Promise<ChangePasswordResponse> {
    return authenticatedRequest<ChangePasswordResponse>(
      "/auth/change-password",
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
  },
};
