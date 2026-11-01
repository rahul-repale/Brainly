import { useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { X } from "lucide-react";
import type { ChecklistBlock as ChecklistBlockType, BlockColor } from "@/types";
import { NOTE_COLORS, CHECKLIST_TEXT } from "@/lib/colors";
import { ConnectorHandle } from "./ConnectorHandle";
import { ResizeHandle } from "./ResizeHandle";
import { ColorPickerPopover } from "./ColorPickerPopover";

interface ChecklistBlockProps {
  block: ChecklistBlockType;
  onDragStart: (e: MouseEvent<HTMLDivElement>, block: ChecklistBlockType) => void;
  onResizeStart: (e: MouseEvent<HTMLDivElement>, block: ChecklistBlockType) => void;
  onDelete: (id: string) => void;
  onToggle: (blockId: string, itemId: string) => void;
  onEditText: (blockId: string, itemId: string, text: string) => void;
  onAddItem: (blockId: string) => void;
  onDeleteItem: (blockId: string, itemId: string) => void;
  onChangeColor: (id: string, color: BlockColor) => void;
  onStartConnection: (e: MouseEvent<HTMLDivElement>, id: string) => void;
  onHoverBlock: (id: string | null) => void;
}

export function ChecklistBlock({
  block,
  onDragStart,
  onResizeStart,
  onDelete,
  onToggle,
  onEditText,
  onAddItem,
  onDeleteItem,
  onChangeColor,
  onStartConnection,
  onHoverBlock,
}: ChecklistBlockProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const c = NOTE_COLORS[block.color];

  return (
    <div
      className="group absolute flex flex-col rounded-lg border border-[#E2DFEC] bg-white shadow-sm"
      style={{ left: block.x, top: block.y, width: block.w, height: block.h }}
      onMouseEnter={() => onHoverBlock(block.id)}
      onMouseLeave={() => onHoverBlock(null)}
    >
      <div
        onMouseDown={(e: MouseEvent<HTMLDivElement>) => onDragStart(e, block)}
        className="flex h-6 shrink-0 cursor-grab items-center justify-between rounded-t-lg px-2"
        style={{ backgroundColor: c.header }}
      >
        <button
          onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
          onClick={() => setPickerOpen((p) => !p)}
          className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: c.header }}
          title="Change color"
        />
        <span className="mx-1.5 flex-1 truncate text-[11px] font-semibold" style={{ color: CHECKLIST_TEXT }}>
          {block.title || "Checklist"}
        </span>
        <button
          onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
          onClick={() => onDelete(block.id)}
          className="shrink-0"
        >
          <X size={11} color={CHECKLIST_TEXT} />
        </button>
      </div>
      <ColorPickerPopover
        open={pickerOpen}
        top={24}
        onPick={(color) => {
          onChangeColor(block.id, color);
          setPickerOpen(false);
        }}
      />
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-1.5">
        {block.items.map((it) => (
          <div key={it.id} className="flex items-center gap-1.5">
            <input type="checkbox" checked={it.done} onChange={() => onToggle(block.id, it.id)} className="shrink-0" />
            <input
              value={it.text}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onEditText(block.id, it.id, e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-xs outline-none"
              style={{ color: it.done ? "#A6A3B0" : "#17151F", textDecoration: it.done ? "line-through" : "none" }}
            />
            <button onClick={() => onDeleteItem(block.id, it.id)} className="shrink-0">
              <X size={10} color="#C7C2D1" />
            </button>
          </div>
        ))}
        <button onClick={() => onAddItem(block.id)} className="mt-0.5 text-left text-[11px] text-brand">
          + add item
        </button>
      </div>
      <ConnectorHandle onMouseDown={(e) => onStartConnection(e, block.id)} />
      <ResizeHandle onMouseDown={(e) => onResizeStart(e, block)} />
    </div>
  );
}
