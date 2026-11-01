import type { Tag } from "@/types";

interface TagPillProps {
  tag: Pick<Tag, "name" | "color" | "bg">;
  active?: boolean;
  onClick?: () => void;
}

export function TagPill({ tag, active, onClick }: TagPillProps) {
  const isInactive = active === false;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
      style={{
        backgroundColor: isInactive ? "transparent" : tag.bg,
        color: tag.color,
        border: isInactive ? "1px solid var(--color-line)" : "1px solid transparent",
      }}
    >
      {tag.name}
    </button>
  );
}
