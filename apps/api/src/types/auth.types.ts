export type UserRole = "admin" | "employee";

export interface User {
  id: number;
  fullname: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface AuthTokenPayload {
  sub: number;
  username: string;
  role: UserRole;
}
