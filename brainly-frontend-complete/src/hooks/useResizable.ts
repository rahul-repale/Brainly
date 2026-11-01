interface ResizeTarget {
  id: string;
  w: number;
  h: number;
}
interface PointerLikeEvent {
  clientX: number;
  clientY: number;
  stopPropagation: () => void;
  preventDefault: () => void;
}

/** Drag-to-resize from a block's corner handle, with a sane minimum size. */
export function useResizable(
  zoom: number,
  onResize: (id: string, w: number, h: number) => void,
  onCommit: () => void,
  minW = 140,
  minH = 90
) {
  function startResize(e: PointerLikeEvent, target: ResizeTarget) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = target.w;
    const origH = target.h;

    function handleMove(ev: globalThis.MouseEvent) {
      const dw = (ev.clientX - startX) / zoom;
      const dh = (ev.clientY - startY) / zoom;
      onResize(target.id, Math.max(minW, origW + dw), Math.max(minH, origH + dh));
    }
    function handleUp() {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      onCommit();
    }
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

  return startResize;
}
