import { AppError } from "../errors/app-error.ts";
import { tagRepository } from "../repositories/tag.repository.ts";
import type { UserRole } from "../types/auth.types.ts";
import type { Tag, UpdateTagInput } from "../types/tag.types.ts";
import {
  parseCreateTagInput,
  parseTagListQuery,
  parseUpdateTagInput,
} from "../validators/tag.validator.ts";

const getTagOrThrow = (id: number): Tag => {
  const tag = tagRepository.findById(id);

  if (!tag) {
    throw new AppError("Etiqueta no encontrada.", 404, "TAG_NOT_FOUND");
  }

  return tag;
};

const ensureNameAvailable = (name: string, excludeId?: number): void => {
  const existing = tagRepository.findByName(name);

  if (existing && existing.id !== excludeId) {
    throw new AppError(
      `Ya existe una etiqueta con el nombre "${name}".`,
      409,
      "TAG_NAME_TAKEN",
    );
  }
};

export const tagService = {
  list(query: unknown, role: UserRole): Tag[] {
    const filters = parseTagListQuery(query);
    const includeInactive = role === "admin" && filters.includeInactive;

    return tagRepository.findAll(includeInactive);
  },

  getById(id: number): Tag {
    return getTagOrThrow(id);
  },

  create(body: unknown): Tag {
    const input = parseCreateTagInput(body);
    ensureNameAvailable(input.name);

    return tagRepository.create({ ...input, isActive: true });
  },

  update(id: number, body: unknown): Tag {
    const tag = getTagOrThrow(id);
    const input = parseUpdateTagInput(body);

    if (input.name !== undefined) {
      ensureNameAvailable(input.name, id);
    }

    const updated = tagRepository.update(id, {
      name: input.name ?? tag.name,
      color: input.color ?? tag.color,
      isActive: input.isActive ?? tag.isActive,
    });

    if (!updated) {
      throw new AppError("Etiqueta no encontrada.", 404, "TAG_NOT_FOUND");
    }

    return updated;
  },

  remove(id: number): Tag {
    const tag = getTagOrThrow(id);

    if (!tag.isActive) {
      return tag;
    }

    const updated = tagRepository.softDelete(id);

    if (!updated) {
      throw new AppError("Etiqueta no encontrada.", 404, "TAG_NOT_FOUND");
    }

    return updated;
  },
};
