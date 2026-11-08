import { compare } from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.ts";
import { AppError } from "../errors/app-error.ts";
import { roleRepository } from "../repositories/role.repository.ts";
import { userRepository } from "../repositories/user.repository.ts";
import type {
  AuthTokenPayload,
  PublicUser,
  User,
  UserRole,
} from "../types/auth.types.ts";
import type { Role } from "../types/role.types.ts";

export interface LoginResult {
  token: string;
  user: PublicUser;
}

const getRoleOrThrow = (roleId: number): Role => {
  const role = roleRepository.findById(roleId);

  if (!role) {
    throw new AppError(
      "El rol del usuario no existe.",
      500,
      "ROLE_NOT_FOUND",
    );
  }

  return role;
};

const toPublicUser = (user: User): PublicUser => {
  const { passwordHash: _passwordHash, roleId, ...publicUser } = user;
  return { ...publicUser, role: getRoleOrThrow(roleId).name };
};

const signToken = (user: User): string => {
  const payload: AuthTokenPayload = {
    sub: user.id,
    username: user.username,
    role: getRoleOrThrow(user.roleId).name,
  };

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as NonNullable<SignOptions["expiresIn"]>,
  };

  return jwt.sign(payload, env.jwtSecret, options);
};

export const authService = {
  async login(username: string, password: string): Promise<LoginResult> {
    const user = userRepository.findByUsername(username);

    if (!user) {
      throw new AppError(
        "Usuario o contraseña incorrectos.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    if (!user.isActive) {
      throw new AppError(
        "El usuario está deshabilitado. Contactá al administrador.",
        403,
        "USER_INACTIVE",
      );
    }

    const passwordMatches = await compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(
        "Usuario o contraseña incorrectos.",
        401,
        "INVALID_CREDENTIALS",
      );
    }

    return {
      token: signToken(user),
      user: toPublicUser(user),
    };
  },

  getProfile(userId: number): PublicUser {
    const user = userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new AppError("Usuario no encontrado.", 401, "UNAUTHORIZED");
    }

    return toPublicUser(user);
  },

  verifyToken(token: string): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, env.jwtSecret);

      if (typeof decoded === "string") {
        throw new Error("Invalid token payload");
      }

      const { sub, username, role } = decoded as jwt.JwtPayload &
        Partial<AuthTokenPayload>;

      if (typeof sub !== "number" || typeof username !== "string" || !role) {
        throw new Error("Invalid token payload");
      }

      return { sub, username, role: role as UserRole };
    } catch {
      throw new AppError(
        "La sesión expiró o el token no es válido.",
        401,
        "UNAUTHORIZED",
      );
    }
  },
};
