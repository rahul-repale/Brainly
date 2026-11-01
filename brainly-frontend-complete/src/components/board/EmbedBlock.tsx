import type { ChangeEvent, MouseEvent } from "react";
import { X } from "lucide-react";
import type { EmbedBlock as EmbedBlockType } from "@/types";
import { PLATFORM_META } from "@/lib/platforms";
import { PLATFORM_ICONS } from "./platformIcons";
import { ConnectorHandle } from "./ConnectorHandle";
import { ResizeHandle } from "./ResizeHandle";

interface EmbedBlockProps {
  block: EmbedBlockType;
  onDragStart: (e: MouseEvent<HTMLDivElement>, block: EmbedBlockType) => void;
  onResizeStart: (e: MouseEvent<HTMLDivElement>, block: EmbedBlockType) => void;
  onDelete: (id: string) => void;
  onChangeTitle: (id: string, title: string) => void;
  onChangeUrl: (id: string, url: string) => void;
  onStartConnection: (e: MouseEvent<HTMLDivElement>, id: string) => void;
  onHoverBlock: (id: string | null) => void;
}

export function EmbedBlock({
  block,
  onDragStart,
  onResizeStart,
  onDelete,
  onChangeTitle,
  onChangeUrl,
  onStartConnection,
  onHoverBlock,
}: EmbedBlockProps) {
  const meta = PLATFORM_META[block.platform];
  const Icon = PLATFORM_ICONS[block.platform];
  const urlEditable = block.platform === "link";

  return (
    <div
      className="group absolute flex flex-col rounded-lg border border-line bg-white shadow-sm"
      style={{ left: block.x, top: block.y, width: block.w, height: block.h }}
      onMouseEnter={() => onHoverBlock(block.id)}
      onMouseLeave={() => onHoverBlock(null)}
    >
      <div
        onMouseDown={(e: MouseEvent<HTMLDivElement>) => onDragStart(e, block)}
        className="flex h-5 shrink-0 cursor-grab items-center justify-between rounded-t-lg px-1.5"
        style={{ backgroundColor: meta.bg }}
      >
        <div className="flex min-w-0 items-center gap-1">
          <Icon size={10} color={meta.color} />
          <span className="truncate text-[10px] font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <button
          onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
          onClick={() => onDelete(block.id)}
          className="shrink-0 opacity-0 group-hover:opacity-100"
        >
          <X size={11} color={meta.color} />
        </button>
      </div>

      {block.thumbnail && (
        <div className="w-full shrink-0 overflow-hidden bg-black/5" style={{ height: Math.max(56, block.h * 0.5) }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <img
            src={block.thumbnail}
            alt=""
            className="h-full w-full object-cover"
            onError={(e: any) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-1 p-2">
        <input
          value={block.title}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeTitle(block.id, e.target.value)}
          placeholder="Title"
          className="min-w-0 bg-transparent text-xs font-medium text-ink outline-none"
        />
        {urlEditable ? (
          <input
            value={block.url}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChangeUrl(block.id, e.target.value)}
            placeholder="https://..."
            className="min-w-0 bg-transparent font-mono text-[10px] text-brand outline-none"
          />
        ) : (
          <div className="truncate font-mono text-[10px] text-slate-light">{block.url.replace(/^https?:\/\//, "")}</div>
        )}
      </div>

      <ConnectorHandle onMouseDown={(e) => onStartConnection(e, block.id)} />
      <ResizeHandle onMouseDown={(e) => onResizeStart(e, block)} />
    </div>
  );
}
