interface DragTarget {
  id: string;
  x: number;
  y: number;
}
interface PointerLikeEvent {
  clientX: number;
  clientY: number;
  stopPropagation: () => void;
  preventDefault: () => void;
}

/** Drag-to-move for board blocks. zoom-aware: divides mouse delta by zoom so
 * dragging feels 1:1 regardless of the current canvas zoom level. */
export function useDraggable(
  zoom: number,
  onMove: (id: string, x: number, y: number) => void,
  onCommit: () => void
) {
  function startDrag(e: PointerLikeEvent, target: DragTarget) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = target.x;
    const origY = target.y;

    function handleMove(ev: globalThis.MouseEvent) {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      onMove(target.id, Math.max(0, origX + dx), Math.max(0, origY + dy));
    }
    function handleUp() {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      onCommit();
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  return startDrag;
}
