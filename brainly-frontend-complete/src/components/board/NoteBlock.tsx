import { useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { X } from "lucide-react";
import type { NoteBlock as NoteBlockType, BlockColor } from "@/types";
import { NOTE_COLORS } from "@/lib/colors";
import { ConnectorHandle } from "./ConnectorHandle";
import { ResizeHandle } from "./ResizeHandle";
import { ColorPickerPopover } from "./ColorPickerPopover";

interface NoteBlockProps {
  block: NoteBlockType;
  onDragStart: (e: MouseEvent<HTMLDivElement>, block: NoteBlockType) => void;
  onResizeStart: (e: MouseEvent<HTMLDivElement>, block: NoteBlockType) => void;
  onDelete: (id: string) => void;
  onChangeText: (id: string, text: string) => void;
  onChangeColor: (id: string, color: BlockColor) => void;
  onStartConnection: (e: MouseEvent<HTMLDivElement>, id: string) => void;
  onHoverBlock: (id: string | null) => void;
}

export function NoteBlock({
  block,
  onDragStart,
  onResizeStart,
  onDelete,
  onChangeText,
  onChangeColor,
  onStartConnection,
  onHoverBlock,
}: NoteBlockProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const c = NOTE_COLORS[block.color];

  return (
    <div
      className="group absolute flex flex-col rounded-lg shadow-sm"
      style={{ left: block.x, top: block.y, width: block.w, height: block.h, backgroundColor: c.bg }}
      onMouseEnter={() => onHoverBlock(block.id)}
      onMouseLeave={() => onHoverBlock(null)}
    >
      <div
        onMouseDown={(e: MouseEvent<HTMLDivElement>) => onDragStart(e, block)}
        className="flex h-5 shrink-0 cursor-grab items-center justify-between rounded-t-lg px-1.5"
        style={{ backgroundColor: c.header }}
      >
        <button
          onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
          onClick={() => setPickerOpen((p) => !p)}
          className="h-2.5 w-2.5 rounded-full border border-black/10"
          style={{ backgroundColor: c.header }}
          title="Change color"
        />
        <button
          onMouseDown={(e: MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
          onClick={() => onDelete(block.id)}
          className="opacity-0 group-hover:opacity-100"
        >
          <X size={11} color="#5C5233" />
        </button>
      </div>
      <ColorPickerPopover
        open={pickerOpen}
        top={20}
        onPick={(color) => {
          onChangeColor(block.id, color);
          setPickerOpen(false);
        }}
      />
      <textarea
        value={block.text}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChangeText(block.id, e.target.value)}
        placeholder="Write anything..."
        className="flex-1 resize-none bg-transparent p-2.5 text-xs leading-relaxed outline-none"
        style={{ color: "#3A331A" }}
      />
      <ConnectorHandle onMouseDown={(e) => onStartConnection(e, block.id)} />
      <ResizeHandle onMouseDown={(e) => onResizeStart(e, block)} />
    </div>
  );
}
