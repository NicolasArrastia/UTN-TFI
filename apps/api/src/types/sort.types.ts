export const SORT_DIRS = ["asc", "desc"] as const;

export type SortDir = (typeof SORT_DIRS)[number];
