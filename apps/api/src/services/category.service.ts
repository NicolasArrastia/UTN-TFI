import { categoryRepository } from "../repositories/category.repository.ts";
import type { Category } from "../types/category.types.ts";

export const categoryService = {
  list(): Category[] {
    return categoryRepository.findAllActive();
  },
};
