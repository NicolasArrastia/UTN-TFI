import { AppError } from "../errors/app-error.ts";
import { getUniqueViolationConstraint } from "../errors/database-error.ts";
import { tagRepository } from "../repositories/tag.repository.ts";
import type { UserRole } from "../types/auth.types.ts";
import type { Tag } from "../types/tag.types.ts";
import {
  parseCreateTagInput,
  parseTagListQuery,
  parseUpdateTagInput,
} from "../validators/tag.validator.ts";

const UNIQUE_NAME_CONSTRAINT = "uq_tags_name";

const nameTakenError = (name: string): AppError =>
  new AppError(
    `Ya existe una etiqueta con el nombre "${name}".`,
    409,
    "TAG_NAME_TAKEN",
  );

const toNameConflictError = (
  error: unknown,
  name: string,
): AppError | undefined =>
  getUniqueViolationConstraint(error) === UNIQUE_NAME_CONSTRAINT
    ? nameTakenError(name)
    : undefined;

const getTagOrThrow = async (id: number): Promise<Tag> => {
  const tag = await tagRepository.findById(id);

  if (!tag) {
    throw new AppError("Etiqueta no encontrada.", 404, "TAG_NOT_FOUND");
  }

  return tag;
};

const ensureNameAvailable = async (
  name: string,
  excludeId?: number,
): Promise<void> => {
  const existing = await tagRepository.findByName(name);

  if (existing && existing.id !== excludeId) {
    throw nameTakenError(name);
  }
};

export const tagService = {
  async list(query: unknown, role: UserRole): Promise<Tag[]> {
    const filters = parseTagListQuery(query);
    const includeInactive = role === "admin" && filters.includeInactive;

    return tagRepository.findAll(includeInactive);
  },

  async getById(id: number): Promise<Tag> {
    return getTagOrThrow(id);
  },

  async create(body: unknown): Promise<Tag> {
    const input = parseCreateTagInput(body);
    await ensureNameAvailable(input.name);

    try {
      return await tagRepository.create({ ...input, isActive: true });
    } catch (error) {
      throw toNameConflictError(error, input.name) ?? error;
    }
  },

  async update(id: number, body: unknown): Promise<Tag> {
    const tag = await getTagOrThrow(id);
    const input = parseUpdateTagInput(body);

    if (input.name !== undefined) {
      await ensureNameAvailable(input.name, id);
    }

    const next = {
      name: input.name ?? tag.name,
      color: input.color ?? tag.color,
      isActive: input.isActive ?? tag.isActive,
    };

    try {
      const updated = await tagRepository.update(id, next);

      if (!updated) {
        throw new AppError("Etiqueta no encontrada.", 404, "TAG_NOT_FOUND");
      }

      return updated;
    } catch (error) {
      throw toNameConflictError(error, next.name) ?? error;
    }
  },

  async remove(id: number): Promise<Tag> {
    const tag = await getTagOrThrow(id);

    if (!tag.isActive) {
      return tag;
    }

    const updated = await tagRepository.softDelete(id);

    if (!updated) {
      throw new AppError("Etiqueta no encontrada.", 404, "TAG_NOT_FOUND");
    }

    return updated;
  },
};
