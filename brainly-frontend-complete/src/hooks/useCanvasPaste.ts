import { useEffect } from "react";

/**
 * Listens for paste events anywhere on the page except inside a native
 * input/textarea (so typing and pasting into notes/checklist items/embed
 * fields keeps working normally) and forwards the pasted text to the board.
 */
export function useCanvasPaste(onPaste: (text: string) => void) {
  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const el = document.activeElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      const text = e.clipboardData?.getData("text/plain");
      if (!text || !text.trim()) return;
      e.preventDefault();
      onPaste(text.trim());
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
