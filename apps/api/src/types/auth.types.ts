export type UserRole = "admin" | "employee";

export interface User {
  id: number;
  fullname: string;
  username: string;
  email: string;
  passwordHash: string;
  roleId: number;
  isActive: boolean;
}

export type PublicUser = Omit<User, "passwordHash" | "roleId"> & {
  role: UserRole;
};

export interface AuthTokenPayload {
  sub: number;
  username: string;
  role: UserRole;
}
