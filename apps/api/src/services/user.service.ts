import { hash } from "bcryptjs";
import { AppError } from "../errors/app-error.ts";
import { getUniqueViolationConstraint } from "../errors/database-error.ts";
import { userRepository } from "../repositories/user.repository.ts";
import type { PublicUser, User, UserRole } from "../types/auth.types.ts";
import {
  parseCreateUserInput,
  parseUpdateUserInput,
  parseUserListQuery,
} from "../validators/user.validator.ts";

const USERNAME_CONSTRAINT = "uq_users_username";
const EMAIL_CONSTRAINT = "uq_users_email";

const toPublicUser = (user: User): PublicUser => {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
};

const usernameTakenError = (): AppError =>
  new AppError(
    "El nombre de usuario ya está registrado.",
    409,
    "USERNAME_ALREADY_EXISTS",
  );

const emailTakenError = (): AppError =>
  new AppError(
    "El correo electrónico ya está registrado.",
    409,
    "EMAIL_ALREADY_EXISTS",
  );

const toConflictError = (error: unknown): AppError | undefined => {
  const constraint = getUniqueViolationConstraint(error);

  if (constraint === USERNAME_CONSTRAINT) {
    return usernameTakenError();
  }

  if (constraint === EMAIL_CONSTRAINT) {
    return emailTakenError();
  }

  return undefined;
};

const getUserOrThrow = async (id: number): Promise<User> => {
  const user = await userRepository.findById(id);

  if (!user) {
    throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
  }

  return user;
};

const ensureEmailAvailable = async (
  email: string,
  excludeId?: number,
): Promise<void> => {
  const existing = await userRepository.findByEmail(email);

  if (existing && existing.id !== excludeId) {
    throw emailTakenError();
  }
};

const ensureSelfModificationAllowed = (
  currentUserId: number,
  targetUserId: number,
  nextRole: UserRole,
  nextIsActive: boolean,
): void => {
  if (currentUserId !== targetUserId) {
    return;
  }

  if (nextRole !== "admin" || !nextIsActive) {
    throw new AppError(
      "No podés quitarte el rol de administrador ni desactivar tu propia cuenta.",
      400,
      "CANNOT_MODIFY_SELF",
    );
  }
};

export const userService = {
  async list(query: unknown, role: UserRole): Promise<PublicUser[]> {
    const filters = parseUserListQuery(query);
    const includeInactive = role === "admin" && filters.includeInactive;

    return userRepository.findAll(includeInactive);
  },

  async create(body: unknown): Promise<PublicUser> {
    const input = parseCreateUserInput(body);

    if (await userRepository.findByUsername(input.username)) {
      throw usernameTakenError();
    }

    await ensureEmailAvailable(input.email);

    const passwordHash = await hash(input.password, 10);

    try {
      const user = await userRepository.create({
        fullname: input.fullname,
        username: input.username,
        email: input.email,
        passwordHash,
        role: input.role,
        isActive: true,
      });

      return toPublicUser(user);
    } catch (error) {
      throw toConflictError(error) ?? error;
    }
  },

  async update(
    id: number,
    body: unknown,
    currentUserId: number,
  ): Promise<PublicUser> {
    const user = await getUserOrThrow(id);
    const input = parseUpdateUserInput(body);

    if (input.email !== undefined) {
      await ensureEmailAvailable(input.email, id);
    }

    const next = {
      fullname: input.fullname ?? user.fullname,
      email: input.email ?? user.email,
      role: input.role ?? user.role,
      isActive: input.isActive ?? user.isActive,
    };

    ensureSelfModificationAllowed(currentUserId, id, next.role, next.isActive);

    try {
      const updated = await userRepository.update(id, next);

      if (!updated) {
        throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
      }

      return updated;
    } catch (error) {
      throw toConflictError(error) ?? error;
    }
  },

  async remove(id: number, currentUserId: number): Promise<PublicUser> {
    if (id === currentUserId) {
      throw new AppError(
        "No podés eliminar tu propia cuenta.",
        400,
        "CANNOT_MODIFY_SELF",
      );
    }

    const user = await getUserOrThrow(id);

    if (!user.isActive) {
      return toPublicUser(user);
    }

    const deleted = await userRepository.softDelete(id);

    if (!deleted) {
      throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
    }

    return deleted;
  },
};
