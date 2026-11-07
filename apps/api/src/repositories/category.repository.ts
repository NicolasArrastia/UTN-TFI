import type { Category } from "../types/category.types.ts";

/**
 * Repositorio en memoria de categorías.
 *
 * El CRUD de categorías todavía no existe. Este repositorio de solo lectura
 * permite validar la categoría de cada producto y devolver su nombre en las
 * respuestas. Cuando se implemente el módulo de categorías, se amplía con las
 * operaciones de escritura sin cambiar el contrato de productos.
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

const findCategoryById = (id: number): Category | undefined =>
  categories.find((category) => category.id === id);

export const categoryRepository = {
  findById: findCategoryById,

  findActiveById(id: number): Category | undefined {
    const category = findCategoryById(id);
    return category?.isActive ? category : undefined;
  },
};
