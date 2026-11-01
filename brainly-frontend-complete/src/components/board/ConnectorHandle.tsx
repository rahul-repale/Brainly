import type { MouseEvent } from "react";

interface ConnectorHandleProps {
  onMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
}

export function ConnectorHandle({ onMouseDown }: ConnectorHandleProps) {
  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute z-10 h-3 w-3 cursor-crosshair rounded-full border-2 border-white bg-brand opacity-0 group-hover:opacity-100"
      style={{ right: -6, top: "50%", transform: "translateY(-50%)" }}
      title="Drag to connect to another block"
    />
  );
}
