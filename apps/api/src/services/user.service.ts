import { hash } from "bcryptjs";
import { AppError } from "../errors/app-error.ts";
import { getUniqueViolationConstraint } from "../errors/database-error.ts";
import { userRepository } from "../repositories/user.repository.ts";
import type { PublicUser, User } from "../types/auth.types.ts";
import { parseCreateUserInput } from "../validators/user.validator.ts";

const toPublicUser = (user: User): PublicUser => {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
};

export const userService = {
  async create(body: unknown): Promise<PublicUser> {
    const input = parseCreateUserInput(body);

    if (await userRepository.findByUsername(input.username)) {
      throw new AppError(
        "El nombre de usuario ya está registrado.",
        409,
        "USERNAME_ALREADY_EXISTS",
      );
    }

    if (await userRepository.findByEmail(input.email)) {
      throw new AppError(
        "El correo electrónico ya está registrado.",
        409,
        "EMAIL_ALREADY_EXISTS",
      );
    }

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
      const constraint = getUniqueViolationConstraint(error);

      if (constraint === "uq_users_username") {
        throw new AppError(
          "El nombre de usuario ya está registrado.",
          409,
          "USERNAME_ALREADY_EXISTS",
        );
      }

      if (constraint === "uq_users_email") {
        throw new AppError(
          "El correo electrónico ya está registrado.",
          409,
          "EMAIL_ALREADY_EXISTS",
        );
      }

      throw error;
    }
  },
};
