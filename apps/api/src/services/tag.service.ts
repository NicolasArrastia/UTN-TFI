import { tagRepository } from "../repositories/tag.repository.ts";
import type { Tag } from "../types/tag.types.ts";

export const tagService = {
  list(): Tag[] {
    return tagRepository.findAllActive();
  },
};
