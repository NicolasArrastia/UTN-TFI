import { AppError } from "../errors/app-error.ts";
import { categoryRepository } from "../repositories/category.repository.ts";
import { productRepository } from "../repositories/product.repository.ts";
import { tagRepository } from "../repositories/tag.repository.ts";
import type {
  PaginatedProducts,
  Product,
  ProductInput,
  ProductResponse,
  UpdateProductInput,
} from "../types/product.types.ts";
import {
  parseCreateProductInput,
  parseProductListQuery,
  parseUpdateProductInput,
} from "../validators/product.validator.ts";

const toProductResponse = async (
  product: Product,
): Promise<ProductResponse> => {
  const category = await categoryRepository.findById(product.categoryId);

  const tags = await Promise.all(
    product.tagIds.map((tagId) => tagRepository.findById(tagId)),
  );

  const tagSummaries = tags.flatMap((tag) =>
    tag ? [{ id: tag.id, name: tag.name, color: tag.color }] : [],
  );

  return {
    id: product.id,
    categoryId: product.categoryId,
    category: category ? { id: category.id, name: category.name } : null,
    name: product.name,
    description: product.description,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    minStock: product.minStock,
    lowStock: product.stock <= product.minStock,
    isActive: product.isActive,
    tags: tagSummaries,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const ensureCategoryExists = async (categoryId: number): Promise<void> => {
  if (!(await categoryRepository.findActiveById(categoryId))) {
    throw new AppError(
      "La categoría indicada no existe o está inactiva.",
      400,
      "INVALID_CATEGORY",
    );
  }
};

const ensureTagsExist = async (tagIds: number[]): Promise<void> => {
  for (const tagId of tagIds) {
    if (!(await tagRepository.findActiveById(tagId))) {
      throw new AppError(
        `La etiqueta ${tagId} no existe o está inactiva.`,
        400,
        "INVALID_TAG",
      );
    }
  }
};

/**
 * Al editar un producto se conservan las etiquetas inactivas que ya tenía.
 * Solo las etiquetas nuevas deben estar activas; las heredadas únicamente
 * tienen que seguir existiendo.
 */
const ensureAssignableTags = async (
  tagIds: number[],
  currentTagIds: number[],
): Promise<void> => {
  for (const tagId of tagIds) {
    const isRetained = currentTagIds.includes(tagId);
    const tag = isRetained
      ? await tagRepository.findById(tagId)
      : await tagRepository.findActiveById(tagId);

    if (!tag) {
      throw new AppError(
        `La etiqueta ${tagId} no existe o está inactiva.`,
        400,
        "INVALID_TAG",
      );
    }
  }
};

const getProductOrThrow = (id: number): Product => {
  const product = productRepository.findById(id);

  if (!product) {
    throw new AppError("Producto no encontrado.", 404, "PRODUCT_NOT_FOUND");
  }

  return product;
};

const buildUpdatedInput = (
  product: Product,
  input: UpdateProductInput,
): ProductInput => ({
  categoryId: input.categoryId ?? product.categoryId,
  name: input.name ?? product.name,
  description:
    input.description !== undefined ? input.description : product.description,
  price: input.price ?? product.price,
  cost: input.cost ?? product.cost,
  stock: input.stock ?? product.stock,
  minStock: input.minStock ?? product.minStock,
  isActive: input.isActive ?? product.isActive,
  tagIds:
    input.tagIds !== undefined ? [...input.tagIds] : [...product.tagIds],
});

export const productService = {
  async list(query: unknown): Promise<PaginatedProducts> {
    const filters = parseProductListQuery(query);
    const { items, total } = productRepository.findAll(filters);

    return {
      products: await Promise.all(items.map(toProductResponse)),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / filters.limit),
      },
    };
  },

  async getById(id: number): Promise<ProductResponse> {
    return toProductResponse(getProductOrThrow(id));
  },

  async create(body: unknown): Promise<ProductResponse> {
    const input = parseCreateProductInput(body);
    await ensureCategoryExists(input.categoryId);
    await ensureTagsExist(input.tagIds);

    return toProductResponse(productRepository.create(input));
  },

  async update(id: number, body: unknown): Promise<ProductResponse> {
    const product = getProductOrThrow(id);
    const input = parseUpdateProductInput(body);

    if (
      input.categoryId !== undefined &&
      input.categoryId !== product.categoryId
    ) {
      await ensureCategoryExists(input.categoryId);
    }

    if (input.tagIds !== undefined) {
      await ensureAssignableTags(input.tagIds, product.tagIds);
    }

    const updated = productRepository.replace(
      id,
      buildUpdatedInput(product, input),
    );

    if (!updated) {
      throw new AppError("Producto no encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    return toProductResponse(updated);
  },

  async remove(id: number): Promise<ProductResponse> {
    const product = getProductOrThrow(id);

    if (!product.isActive) {
      return toProductResponse(product);
    }

    const updated = productRepository.deactivate(id);

    if (!updated) {
      throw new AppError("Producto no encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    return toProductResponse(updated);
  },
};
