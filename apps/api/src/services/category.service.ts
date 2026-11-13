import { AppError } from "../errors/app-error.ts";
import { getUniqueViolationConstraint } from "../errors/database-error.ts";
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

const UNIQUE_NAME_CONSTRAINT = "uq_categories_name";

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

const nameTakenError = (name: string): AppError =>
  new AppError(
    `Ya existe una categoría con el nombre "${name}".`,
    409,
    "CATEGORY_NAME_TAKEN",
  );

const toNameConflictError = (
  error: unknown,
  name: string,
): AppError | undefined =>
  getUniqueViolationConstraint(error) === UNIQUE_NAME_CONSTRAINT
    ? nameTakenError(name)
    : undefined;

const getCategoryOrThrow = async (id: number): Promise<Category> => {
  const category = await categoryRepository.findById(id);

  if (!category) {
    throw new AppError(
      "Categoría no encontrada.",
      404,
      "CATEGORY_NOT_FOUND",
    );
  }

  return category;
};

const ensureNameAvailable = async (
  name: string,
  excludeId?: number,
): Promise<void> => {
  const existing = await categoryRepository.findByName(name);

  if (existing && existing.id !== excludeId) {
    throw nameTakenError(name);
  }
};

export const categoryService = {
  async list(query: unknown, role: UserRole): Promise<CategoryResponse[]> {
    const filters = parseCategoryListQuery(query);
    const includeInactive = role === "admin" && filters.includeInactive;
    const categories = await categoryRepository.findAll(includeInactive);

    return categories.map((category) => toCategoryResponse(category, role));
  },

  async getById(id: number, role: UserRole): Promise<CategoryResponse> {
    return toCategoryResponse(await getCategoryOrThrow(id), role);
  },

  async create(body: unknown, role: UserRole): Promise<CategoryResponse> {
    const input = parseCreateCategoryInput(body);
    await ensureNameAvailable(input.name);

    try {
      const category = await categoryRepository.create({
        ...input,
        isActive: true,
      });

      return toCategoryResponse(category, role);
    } catch (error) {
      throw toNameConflictError(error, input.name) ?? error;
    }
  },

  async update(
    id: number,
    body: unknown,
    role: UserRole,
  ): Promise<CategoryResponse> {
    const category = await getCategoryOrThrow(id);
    const input = parseUpdateCategoryInput(body);

    if (input.name !== undefined) {
      await ensureNameAvailable(input.name, id);
    }

    const next = {
      name: input.name ?? category.name,
      description:
        input.description !== undefined
          ? input.description
          : category.description,
      isActive: input.isActive ?? category.isActive,
    };

    try {
      const updated = await categoryRepository.update(id, next);

      if (!updated) {
        throw new AppError(
          "Categoría no encontrada.",
          404,
          "CATEGORY_NOT_FOUND",
        );
      }

      return toCategoryResponse(updated, role);
    } catch (error) {
      throw toNameConflictError(error, next.name) ?? error;
    }
  },

  async remove(id: number, role: UserRole): Promise<CategoryResponse> {
    const category = await getCategoryOrThrow(id);

    if (!category.isActive) {
      return toCategoryResponse(category, role);
    }

    const updated = await categoryRepository.softDelete(id);

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
