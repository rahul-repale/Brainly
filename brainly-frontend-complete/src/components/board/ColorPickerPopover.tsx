import type { MouseEvent } from "react";
import { NOTE_COLORS, NOTE_COLOR_CYCLE } from "@/lib/colors";
import type { BlockColor } from "@/types";

interface ColorPickerPopoverProps {
  open: boolean;
  top: number;
  onPick: (color: BlockColor) => void;
}

export function ColorPickerPopover({ open, top, onPick }: ColorPickerPopoverProps) {
  if (!open) return null;
  return (
    <div
      onMouseDown={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      className="absolute left-1.5 z-20 flex gap-1 rounded-md border border-line bg-white p-1 shadow-md"
      style={{ top }}
    >
      {NOTE_COLOR_CYCLE.map((cname) => (
        <button
          key={cname}
          onClick={() => onPick(cname)}
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: NOTE_COLORS[cname].header }}
        />
      ))}
    </div>
  );
}
