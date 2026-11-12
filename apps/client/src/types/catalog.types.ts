export interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
