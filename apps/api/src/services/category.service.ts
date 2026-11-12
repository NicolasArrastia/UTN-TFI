import { AppError } from "../errors/app-error.ts";
import { categoryRepository } from "../repositories/category.repository.ts";
import { productRepository } from "../repositories/product.repository.ts";
import type { UserRole } from "../types/auth.types.ts";
import type {
  Category,
  CategoryResponse,
} from "../types/category.types.ts";
import {
  parseCategoryListQuery,
  parseCreateCategoryInput,
  parseUpdateCategoryInput,
} from "../validators/category.validator.ts";

const toCategoryResponse = (
  category: Category,
  role: UserRole,
): CategoryResponse => {
  if (role !== "admin") {
    return category;
  }

  return {
    ...category,
    activeProductCount: productRepository.countActiveByCategoryId(category.id),
  };
};

const getCategoryOrThrow = (id: number): Category => {
  const category = categoryRepository.findById(id);

  if (!category) {
    throw new AppError(
      "Categoría no encontrada.",
      404,
      "CATEGORY_NOT_FOUND",
    );
  }

  return category;
};

const ensureNameAvailable = (name: string, excludeId?: number): void => {
  const existing = categoryRepository.findByName(name);

  if (existing && existing.id !== excludeId) {
    throw new AppError(
      `Ya existe una categoría con el nombre "${name}".`,
      409,
      "CATEGORY_NAME_TAKEN",
    );
  }
};

export const categoryService = {
  list(query: unknown, role: UserRole): CategoryResponse[] {
    const filters = parseCategoryListQuery(query);
    const includeInactive = role === "admin" && filters.includeInactive;

    return categoryRepository
      .findAll(includeInactive)
      .map((category) => toCategoryResponse(category, role));
  },

  getById(id: number, role: UserRole): CategoryResponse {
    return toCategoryResponse(getCategoryOrThrow(id), role);
  },

  create(body: unknown, role: UserRole): CategoryResponse {
    const input = parseCreateCategoryInput(body);
    ensureNameAvailable(input.name);

    const category = categoryRepository.create({ ...input, isActive: true });

    return toCategoryResponse(category, role);
  },

  update(id: number, body: unknown, role: UserRole): CategoryResponse {
    const category = getCategoryOrThrow(id);
    const input = parseUpdateCategoryInput(body);

    if (input.name !== undefined) {
      ensureNameAvailable(input.name, id);
    }

    const updated = categoryRepository.update(id, {
      name: input.name ?? category.name,
      description:
        input.description !== undefined
          ? input.description
          : category.description,
      isActive: input.isActive ?? category.isActive,
    });

    if (!updated) {
      throw new AppError(
        "Categoría no encontrada.",
        404,
        "CATEGORY_NOT_FOUND",
      );
    }

    return toCategoryResponse(updated, role);
  },

  remove(id: number, role: UserRole): CategoryResponse {
    const category = getCategoryOrThrow(id);

    if (!category.isActive) {
      return toCategoryResponse(category, role);
    }

    const updated = categoryRepository.softDelete(id);

    if (!updated) {
      throw new AppError(
        "Categoría no encontrada.",
        404,
        "CATEGORY_NOT_FOUND",
      );
    }

    return toCategoryResponse(updated, role);
  },
};
