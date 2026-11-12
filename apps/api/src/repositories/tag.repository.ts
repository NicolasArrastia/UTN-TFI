import type { Tag, TagInput } from "../types/tag.types.ts";

/**
 * Repositorio en memoria de etiquetas.
 *
 * Replica las columnas de la tabla `tags`. Cuando PostgreSQL esté conectado,
 * este módulo se reemplaza por consultas reales sin modificar servicios ni
 * controladores. El contrato que usan los productos se mantiene: `findById` y
 * `findActiveById` siguen disponibles.
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

let nextId = tags.length + 1;

const normalizeName = (name: string): string =>
  name.trim().toLocaleLowerCase("es");

const findById = (id: number): Tag | undefined =>
  tags.find((tag) => tag.id === id);

export const tagRepository = {
  findById,

  findActiveById(id: number): Tag | undefined {
    const tag = findById(id);
    return tag?.isActive ? tag : undefined;
  },

  findByName(name: string): Tag | undefined {
    const normalized = normalizeName(name);
    return tags.find((tag) => normalizeName(tag.name) === normalized);
  },

  findAll(includeInactive: boolean): Tag[] {
    const filtered = includeInactive
      ? tags
      : tags.filter((tag) => tag.isActive);

    return [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
  },

  create(input: TagInput): Tag {
    const now = new Date().toISOString();
    const tag: Tag = {
      id: nextId,
      name: input.name,
      color: input.color,
      isActive: input.isActive,
      createdAt: now,
      updatedAt: now,
    };

    nextId += 1;
    tags.push(tag);

    return tag;
  },

  update(id: number, input: TagInput): Tag | undefined {
    const index = tags.findIndex((tag) => tag.id === id);
    const current = tags[index];

    if (!current) {
      return undefined;
    }

    const updated: Tag = {
      id: current.id,
      name: input.name,
      color: input.color,
      isActive: input.isActive,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    tags[index] = updated;

    return updated;
  },

  softDelete(id: number): Tag | undefined {
    const index = tags.findIndex((tag) => tag.id === id);
    const current = tags[index];

    if (!current) {
      return undefined;
    }

    const updated: Tag = {
      ...current,
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    tags[index] = updated;

    return updated;
  },
};
