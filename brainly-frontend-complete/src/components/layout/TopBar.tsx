import type { ChangeEvent } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui";

interface TopBarProps {
  title: string;
  subtitle?: string;
  search?: string;
  onSearch?: (value: string) => void;
  onAdd?: () => void;
  addLabel?: string;
}

export function TopBar({ title, subtitle, search, onSearch, onAdd, addLabel = "New card" }: TopBarProps) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {onSearch && (
          <div className="flex w-[260px] items-center gap-2 rounded-lg border border-line bg-white px-3 py-2.5">
            <Search size={15} className="text-slate-light" />
            <input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onSearch(e.target.value)}
              placeholder="Search your brain..."
              className="flex-1 bg-transparent text-sm text-ink outline-none"
            />
          </div>
        )}
        {onAdd && (
          <Button onClick={onAdd}>
            <Plus size={16} /> {addLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
