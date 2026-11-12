import type { Category, CategoryInput } from "../types/category.types.ts";

/**
 * Repositorio en memoria de categorías.
 *
 * Replica las columnas de la tabla `categories`. Cuando PostgreSQL esté
 * conectado, este módulo se reemplaza por consultas reales sin modificar
 * servicios ni controladores. El contrato que usan los productos se mantiene:
 * `findById` y `findActiveById` siguen disponibles.
 */
const SEED_DATE = "2026-01-15T12:00:00.000Z";

const categories: Category[] = [
  {
    id: 1,
    name: "Almacén",
    description: "Productos secos y de despensa.",
    isActive: true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 2,
    name: "Bebidas",
    description: "Bebidas con y sin alcohol.",
    isActive: true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 3,
    name: "Limpieza",
    description: "Artículos de limpieza para el hogar.",
    isActive: true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 4,
    name: "Electrónica",
    description: "Accesorios y productos electrónicos.",
    isActive: true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
];

let nextId = categories.length + 1;

const normalizeName = (name: string): string =>
  name.trim().toLocaleLowerCase("es");

const findById = (id: number): Category | undefined =>
  categories.find((category) => category.id === id);

export const categoryRepository = {
  findById,

  findActiveById(id: number): Category | undefined {
    const category = findById(id);
    return category?.isActive ? category : undefined;
  },

  findByName(name: string): Category | undefined {
    const normalized = normalizeName(name);
    return categories.find(
      (category) => normalizeName(category.name) === normalized,
    );
  },

  findAll(includeInactive: boolean): Category[] {
    const filtered = includeInactive
      ? categories
      : categories.filter((category) => category.isActive);

    return [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
  },

  create(input: CategoryInput): Category {
    const now = new Date().toISOString();
    const category: Category = {
      id: nextId,
      name: input.name,
      description: input.description,
      isActive: input.isActive,
      createdAt: now,
      updatedAt: now,
    };

    nextId += 1;
    categories.push(category);

    return category;
  },

  update(id: number, input: CategoryInput): Category | undefined {
    const index = categories.findIndex((category) => category.id === id);
    const current = categories[index];

    if (!current) {
      return undefined;
    }

    const updated: Category = {
      id: current.id,
      name: input.name,
      description: input.description,
      isActive: input.isActive,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    categories[index] = updated;

    return updated;
  },

  softDelete(id: number): Category | undefined {
    const index = categories.findIndex((category) => category.id === id);
    const current = categories[index];

    if (!current) {
      return undefined;
    }

    const updated: Category = {
      ...current,
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    categories[index] = updated;

    return updated;
  },
};
