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

const toProductResponse = (product: Product): ProductResponse => {
  const category = categoryRepository.findById(product.categoryId);

  const tags = product.tagIds.flatMap((tagId) => {
    const tag = tagRepository.findById(tagId);
    return tag ? [{ id: tag.id, name: tag.name, color: tag.color }] : [];
  });

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
    modifiedBy: product.modifiedBy,
    tags,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

const ensureCategoryExists = (categoryId: number): void => {
  if (!categoryRepository.findActiveById(categoryId)) {
    throw new AppError(
      "La categoría indicada no existe o está inactiva.",
      400,
      "INVALID_CATEGORY",
    );
  }
};

const ensureTagsExist = (tagIds: number[]): void => {
  for (const tagId of tagIds) {
    if (!tagRepository.findActiveById(tagId)) {
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
  list(query: unknown): PaginatedProducts {
    const filters = parseProductListQuery(query);
    const { items, total } = productRepository.findAll(filters);

    return {
      products: items.map(toProductResponse),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / filters.limit),
      },
    };
  },

  getById(id: number): ProductResponse {
    return toProductResponse(getProductOrThrow(id));
  },

  create(body: unknown, actorId: number): ProductResponse {
    const input = parseCreateProductInput(body);
    ensureCategoryExists(input.categoryId);
    ensureTagsExist(input.tagIds);

    return toProductResponse(productRepository.create(input, actorId));
  },

  update(id: number, body: unknown, actorId: number): ProductResponse {
    const product = getProductOrThrow(id);
    const input = parseUpdateProductInput(body);

    if (input.categoryId !== undefined) {
      ensureCategoryExists(input.categoryId);
    }

    if (input.tagIds !== undefined) {
      ensureTagsExist(input.tagIds);
    }

    const updated = productRepository.replace(
      id,
      buildUpdatedInput(product, input),
      actorId,
    );

    if (!updated) {
      throw new AppError("Producto no encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    return toProductResponse(updated);
  },

  remove(id: number, actorId: number): ProductResponse {
    const product = getProductOrThrow(id);

    if (!product.isActive) {
      return toProductResponse(product);
    }

    const updated = productRepository.deactivate(id, actorId);

    if (!updated) {
      throw new AppError("Producto no encontrado.", 404, "PRODUCT_NOT_FOUND");
    }

    return toProductResponse(updated);
  },
};
