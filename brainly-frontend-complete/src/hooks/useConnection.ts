import { useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
}
interface PointerLikeEvent {
  clientX: number;
  clientY: number;
  stopPropagation: () => void;
  preventDefault: () => void;
}
interface SurfaceRef {
  current: { getBoundingClientRect(): { left: number; top: number } } | null;
}

/** Hover-to-target, drag-to-connect between two blocks on the same board. */
export function useConnection(zoom: number, surfaceRef: SurfaceRef, onConnect: (fromId: string, toId: string) => void) {
  const [drawingFrom, setDrawingFrom] = useState<string | null>(null);
  const [drawPos, setDrawPos] = useState<Point>({ x: 0, y: 0 });
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const drawingFromRef = useRef<string | null>(null);
  const hoveredBlockRef = useRef<string | null>(null);

  function setHovered(id: string | null) {
    hoveredBlockRef.current = id;
    setHoveredBlockId(id);
  }

  function toSurfaceCoords(clientX: number, clientY: number): Point {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  }

  function startConnection(e: PointerLikeEvent, blockId: string) {
    e.stopPropagation();
    e.preventDefault();
    drawingFromRef.current = blockId;
    setDrawingFrom(blockId);
    setDrawPos(toSurfaceCoords(e.clientX, e.clientY));

    function handleMove(ev: globalThis.MouseEvent) {
      setDrawPos(toSurfaceCoords(ev.clientX, ev.clientY));
    }
    function handleUp() {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      const from = drawingFromRef.current;
      const to = hoveredBlockRef.current;
      if (from && to && to !== from) onConnect(from, to);
      drawingFromRef.current = null;
      setDrawingFrom(null);
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  return { drawingFrom, drawPos, hoveredBlockId, setHovered, startConnection };
}
