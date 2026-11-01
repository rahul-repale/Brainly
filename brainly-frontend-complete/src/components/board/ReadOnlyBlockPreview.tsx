import type { Block } from "@/types";
import { NOTE_COLORS } from "@/lib/colors";
import { PLATFORM_META } from "@/lib/platforms";
import { PLATFORM_ICONS } from "./platformIcons";

interface ReadOnlyBlockPreviewProps {
  block: Block;
}

export function ReadOnlyBlockPreview({ block }: ReadOnlyBlockPreviewProps) {
  if (block.type === "note") {
    const c = NOTE_COLORS[block.color];
    return (
      <div
        className="whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed"
        style={{ backgroundColor: c.bg, color: "#3A331A", minHeight: 80 }}
      >
        {block.text || <span className="opacity-50">Empty note</span>}
      </div>
    );
  }

  if (block.type === "checklist") {
    return (
      <div className="rounded-lg border border-line bg-white p-3">
        <div className="mb-2 text-xs font-semibold text-ink">{block.title || "Checklist"}</div>
        <div className="flex flex-col gap-1.5">
          {block.items.map((it) => (
            <div
              key={it.id}
              className={`flex items-center gap-1.5 text-xs ${it.done ? "text-slate-light line-through" : "text-ink"}`}
            >
              <input type="checkbox" checked={it.done} disabled />
              {it.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const meta = PLATFORM_META[block.platform];
  const Icon = PLATFORM_ICONS[block.platform];
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-3">
      <Icon size={14} color={meta.color} />
      <div className="min-w-0">
        <div className="truncate text-xs font-medium text-ink">{block.title || meta.label}</div>
        {block.url && (
          <div className="truncate font-mono text-[11px]" style={{ color: meta.color }}>
            {block.url.replace(/^https?:\/\//, "")}
          </div>
        )}
      </div>
    </div>
  );
}
