export interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Campos que el cliente puede enviar al crear una categoría. */
export interface CreateCategoryInput {
  name: string;
  description: string | null;
}

/** Datos de negocio completos que recibe el repositorio para crear o reemplazar. */
export interface CategoryInput extends CreateCategoryInput {
  isActive: boolean;
}

/** Campos que el cliente puede enviar al modificar una categoría. */
export interface UpdateCategoryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

/** Filtros ya validados del listado. */
export interface CategoryListQuery {
  includeInactive: boolean;
}

/** Respuesta pública; el conteo de productos activos solo se envía al admin. */
export interface CategoryResponse extends Category {
  activeProductCount?: number;
}
