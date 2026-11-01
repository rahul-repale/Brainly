import type { ReactNode, MouseEvent } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

export function Modal({ title, onClose, children, width = 560 }: ModalProps) {
  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-6"
      onClick={onClose}
    >
      <div
        onClick={stop}
        className="flex max-h-[85vh] flex-col rounded-2xl border border-line bg-white"
        style={{ width }}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100" aria-label="Close">
            <X size={18} className="text-slate" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
