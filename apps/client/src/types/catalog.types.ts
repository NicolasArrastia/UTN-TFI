export interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  activeProductCount?: number;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  description: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CreateTagPayload {
  name: string;
  color: string;
}

export interface UpdateTagPayload {
  name?: string;
  color?: string;
  isActive?: boolean;
}
