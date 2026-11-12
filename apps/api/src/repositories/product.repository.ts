import type {
  Product,
  ProductInput,
  ProductListQuery,
} from "../types/product.types.ts";

/**
 * Repositorio en memoria de productos.
 *
 * Replica las columnas de la tabla `products` y la relación `product_tags`.
 * Cuando PostgreSQL esté conectado, este módulo se reemplaza por consultas
 * reales sin modificar servicios ni controladores.
 */
const SEED_DATE = "2026-01-15T12:00:00.000Z";

const products: Product[] = [
  {
    id: 1,
    categoryId: 1,
    name: "Yerba mate compuesta 1 kg",
    description: "Yerba mate con hierbas serranas.",
    price: 4500,
    cost: 3200,
    stock: 40,
    minStock: 10,
    isActive: true,
    tagIds: [1],
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 2,
    categoryId: 2,
    name: "Gaseosa cola 2.25 L",
    description: "Botella retornable.",
    price: 2800,
    cost: 1900,
    stock: 24,
    minStock: 6,
    isActive: true,
    tagIds: [2],
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 3,
    categoryId: 3,
    name: "Detergente 750 ml",
    description: "Detergente concentrado con aroma a limón.",
    price: 2100,
    cost: 1400,
    stock: 5,
    minStock: 8,
    isActive: true,
    tagIds: [1],
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 4,
    categoryId: 4,
    name: "Auriculares inalámbricos",
    description: "Auriculares Bluetooth con estuche de carga.",
    price: 35000,
    cost: 24000,
    stock: 12,
    minStock: 3,
    isActive: true,
    tagIds: [2],
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
];

let nextId = products.length + 1;

const matchesFilters = (
  product: Product,
  filters: ProductListQuery,
): boolean => {
  if (filters.isActive !== "all" && product.isActive !== filters.isActive) {
    return false;
  }

  if (
    filters.categoryId !== undefined &&
    product.categoryId !== filters.categoryId
  ) {
    return false;
  }

  if (filters.tagId !== undefined && !product.tagIds.includes(filters.tagId)) {
    return false;
  }

  if (filters.lowStock && product.stock > product.minStock) {
    return false;
  }

  if (filters.search !== undefined) {
    const search = filters.search.toLowerCase();
    if (!product.name.toLowerCase().includes(search)) {
      return false;
    }
  }

  return true;
};

const findById = (id: number): Product | undefined =>
  products.find((product) => product.id === id);

export const productRepository = {
  findAll(filters: ProductListQuery): { items: Product[]; total: number } {
    const filtered = products.filter((product) =>
      matchesFilters(product, filters),
    );

    const sorted = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );

    const offset = (filters.page - 1) * filters.limit;

    return {
      items: sorted.slice(offset, offset + filters.limit),
      total: filtered.length,
    };
  },

  findById,

  countActiveByCategoryId(categoryId: number): number {
    return products.filter(
      (product) => product.categoryId === categoryId && product.isActive,
    ).length;
  },

  create(input: ProductInput): Product {
    const now = new Date().toISOString();
    const product: Product = {
      id: nextId,
      ...input,
      tagIds: [...input.tagIds],
      createdAt: now,
      updatedAt: now,
    };

    nextId += 1;
    products.push(product);

    return product;
  },

  replace(id: number, input: ProductInput): Product | undefined {
    const index = products.findIndex((product) => product.id === id);
    const current = products[index];

    if (!current) {
      return undefined;
    }

    const updated: Product = {
      id: current.id,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      price: input.price,
      cost: input.cost,
      stock: input.stock,
      minStock: input.minStock,
      isActive: input.isActive,
      tagIds: [...input.tagIds],
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updated;

    return updated;
  },

  deactivate(id: number): Product | undefined {
    const index = products.findIndex((product) => product.id === id);
    const current = products[index];

    if (!current) {
      return undefined;
    }

    const updated: Product = {
      ...current,
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updated;

    return updated;
  },
};
