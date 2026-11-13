import { compare, hash } from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.ts";
import { AppError } from "../errors/app-error.ts";
import { userRepository } from "../repositories/user.repository.ts";
import type {
  AuthTokenPayload,
  PublicUser,
  User,
  UserRole,
} from "../types/auth.types.ts";

export interface LoginResult {
  token: string;
  user: PublicUser;
}

const toPublicUser = (user: User): PublicUser => {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
};

const signToken = (user: User): string => {
  const payload: AuthTokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role,
  };

  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as NonNullable<SignOptions["expiresIn"]>,
  };

  return jwt.sign(payload, env.jwtSecret, options);
};

export const authService = {
  async login(username: string, password: string): Promise<LoginResult> {
    const user = await userRepository.findByUsername(username);

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

  async getProfile(userId: number): Promise<PublicUser> {
    const user = await userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new AppError("Usuario no encontrado.", 401, "UNAUTHORIZED");
    }

    return toPublicUser(user);
  },

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new AppError("Usuario no encontrado.", 401, "UNAUTHORIZED");
    }

    const passwordMatches = await compare(currentPassword, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(
        "La contraseña actual es incorrecta.",
        400,
        "INVALID_CURRENT_PASSWORD",
      );
    }

    if (await compare(newPassword, user.passwordHash)) {
      throw new AppError(
        "La nueva contraseña debe ser diferente de la actual.",
        400,
        "VALIDATION_ERROR",
      );
    }

    const passwordHash = await hash(newPassword, 10);
    const updated = await userRepository.updatePassword(userId, passwordHash);

    if (!updated) {
      throw new AppError(
        "No se pudo actualizar la contraseña.",
        404,
        "USER_NOT_FOUND",
      );
    }
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
