import type { MouseEvent } from "react";

interface ResizeHandleProps {
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
}

export function ResizeHandle({ onMouseDown }: ResizeHandleProps) {
  return (
    <div onMouseDown={onMouseDown} className="absolute bottom-0.5 right-0.5 z-10 cursor-nwse-resize opacity-0 group-hover:opacity-100">
      <svg width="10" height="10" viewBox="0 0 10 10">
        <path d="M9 1L1 9M9 5L5 9" stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
      </svg>
    </div>
  );
}
