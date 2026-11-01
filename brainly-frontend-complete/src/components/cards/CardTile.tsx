import { ChevronRight } from "lucide-react";
import type { Card, Tag } from "@/types";
import { TagPill } from "@/components/ui";

interface CardTileProps {
  card: Card;
  allTags: Tag[];
  onOpen?: () => void;
  readOnly?: boolean;
}

export function CardTile({ card, allTags, onOpen, readOnly }: CardTileProps) {
  const cardTags = card.tagIds
    .map((id) => allTags.find((t) => t.id === id))
    .filter((t): t is Tag => Boolean(t));
  const spineColor = cardTags[0]?.color ?? "#A6A3B0";

  return (
    <div
      onClick={readOnly ? undefined : onOpen}
      className={`relative flex flex-col gap-2.5 rounded-xl border border-line bg-white p-4 pl-5 transition-shadow hover:shadow-lg ${
        readOnly ? "" : "cursor-pointer"
      }`}
    >
      <span className="absolute inset-y-0 left-0 w-1 rounded-l-xl" style={{ backgroundColor: spineColor }} />
      <div className="flex flex-wrap gap-1">
        {cardTags.length > 0 ? (
          cardTags.map((t) => <TagPill key={t.id} tag={t} />)
        ) : (
          <span className="text-[11px] text-slate-light">No tags</span>
        )}
      </div>
      <h3 className="text-sm font-semibold leading-snug text-ink">{card.title}</h3>
      <p className="line-clamp-2 text-xs leading-relaxed text-slate">{card.description}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-mono text-[11px] text-slate-light">{card.createdAt}</span>
        {!readOnly && (
          <span className="flex items-center gap-1 text-xs font-semibold text-brand">
            Open <ChevronRight size={13} />
          </span>
        )}
      </div>
    </div>
  );
}
