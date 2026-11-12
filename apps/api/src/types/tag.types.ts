export interface Tag {
  id: number;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Campos que el cliente puede enviar al crear una etiqueta. */
export interface CreateTagInput {
  name: string;
  color: string;
}

/** Datos de negocio completos que recibe el repositorio para crear o reemplazar. */
export interface TagInput extends CreateTagInput {
  isActive: boolean;
}

/** Campos que el cliente puede enviar al modificar una etiqueta. */
export interface UpdateTagInput {
  name?: string;
  color?: string;
  isActive?: boolean;
}

/** Filtros ya validados del listado. */
export interface TagListQuery {
  includeInactive: boolean;
}
