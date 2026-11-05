export type UserRole = "admin" | "employee";

export interface AuthUser {
  id: number;
  fullname: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface ProfileResponse {
  user: AuthUser;
}

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}
