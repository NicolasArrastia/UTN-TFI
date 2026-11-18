import { IconSortAsc, IconSortDesc } from "./icons.tsx";
import type { SortDir } from "../types/sort.types.ts";

interface SortableHeaderProps<K extends string> {
  label: string;
  column: K;
  sortBy: K;
  sortDir: SortDir;
  defaultDir?: SortDir;
  onSortChange: (column: K, direction: SortDir) => void;
}

const TH =
  "whitespace-nowrap border-b border-line px-[22px] py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.07em] text-muted max-md:px-4";

const BUTTON =
  "inline-flex cursor-pointer items-center gap-1 rounded-sm text-inherit transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand/13";

export function SortableHeader<K extends string>({
  label,
  column,
  sortBy,
  sortDir,
  defaultDir = "asc",
  onSortChange,
}: SortableHeaderProps<K>) {
  const isActive = sortBy === column;
  const direction = isActive ? sortDir : defaultDir;
  const nextDirection: SortDir =
    isActive && sortDir === "asc" ? "desc" : isActive ? "asc" : defaultDir;
  const ariaSort = isActive
    ? sortDir === "asc"
      ? "ascending"
      : "descending"
    : "none";
  const Icon = direction === "asc" ? IconSortAsc : IconSortDesc;

  return (
    <th scope="col" aria-sort={ariaSort} className={TH}>
      <button
        type="button"
        className={BUTTON}
        onClick={() => onSortChange(column, nextDirection)}
      >
        {label}
        <Icon
          width={12}
          height={12}
          className={isActive ? undefined : "opacity-30"}
        />
      </button>
    </th>
  );
}
