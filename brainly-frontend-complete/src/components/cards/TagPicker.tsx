import { useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import type { Tag } from "@/types";
import { TagPill, TextInput, Button } from "@/components/ui";

interface TagPickerProps {
  allTags: Tag[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCreate: (name: string) => void;
}

export function TagPicker({ allTags, selectedIds, onToggle, onCreate }: TagPickerProps) {
  const [newTagName, setNewTagName] = useState("");

  function submitNew() {
    if (!newTagName.trim()) return;
    onCreate(newTagName);
    setNewTagName("");
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {allTags.length === 0 && (
          <span className="text-xs text-slate-light">No tags yet — create your first one below.</span>
        )}
        {allTags.map((t) => (
          <TagPill key={t.id} tag={t} active={selectedIds.includes(t.id)} onClick={() => onToggle(t.id)} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <TextInput
          value={newTagName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewTagName(e.target.value)}
          placeholder="Create a new tag..."
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitNew();
            }
          }}
        />
        <Button variant="ghost" onClick={submitNew}>
          Add
        </Button>
      </div>
    </div>
  );
}
