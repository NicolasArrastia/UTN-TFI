import type { Tag } from "../types/tag.types.ts";

/**
 * Repositorio en memoria de etiquetas.
 *
 * El CRUD de etiquetas todavía no existe. Este repositorio de solo lectura
 * permite validar las etiquetas asociadas a cada producto y devolver sus datos
 * en las respuestas. Cuando se implemente el módulo de etiquetas, se amplía con
 * las operaciones de escritura sin cambiar el contrato de productos.
 */
const SEED_DATE = "2026-01-15T12:00:00.000Z";

const tags: Tag[] = [
  {
    id: 1,
    name: "Oferta",
    color: "#F97316",
    isActive: true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 2,
    name: "Novedad",
    color: "#22C55E",
    isActive: true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
  {
    id: 3,
    name: "Sin TACC",
    color: "#0EA5E9",
    isActive: true,
    createdAt: SEED_DATE,
    updatedAt: SEED_DATE,
  },
];

const findTagById = (id: number): Tag | undefined =>
  tags.find((tag) => tag.id === id);

export const tagRepository = {
  findById: findTagById,

  findActiveById(id: number): Tag | undefined {
    const tag = findTagById(id);
    return tag?.isActive ? tag : undefined;
  },
};
