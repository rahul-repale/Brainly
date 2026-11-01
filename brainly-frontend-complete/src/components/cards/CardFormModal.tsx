import { useState } from "react";
import type { ChangeEvent } from "react";
import type { Card, Tag } from "@/types";
import type { NewCardInput } from "@/stores/useCardStore";
import { Modal, Field, TextInput, Button } from "@/components/ui";
import { TagPicker } from "./TagPicker";

interface CardFormModalProps {
  initial: Card | null;
  allTags: Tag[];
  onCreateTag: (name: string) => string | null | Promise<string | null>;
  onSave: (data: NewCardInput) => void;
  onClose: () => void;
}

export function CardFormModal({ initial, allTags, onCreateTag, onSave, onClose }: CardFormModalProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tagIds, setTagIds] = useState<string[]>(initial?.tagIds ?? []);
  const [error, setError] = useState("");

  function toggleTag(id: string) {
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCreateTag(name: string) {
    const id = await onCreateTag(name);
    if (id) setTagIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function handleSave() {
    if (!title.trim()) {
      setError("Give this card a title.");
      return;
    }
    onSave({ title: title.trim(), description: description.trim(), tagIds });
  }

  return (
    <Modal title={initial ? "Edit card details" : "Add a new card"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <Field label="Title">
          <TextInput
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setTitle(e.target.value);
              setError("");
            }}
            placeholder="What are you saving?"
          />
        </Field>
        <Field label="Description">
          <TextInput
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="One line summary shown on the card"
          />
        </Field>
        <Field label="Tags">
          <TagPicker allTags={allTags} selectedIds={tagIds} onToggle={toggleTag} onCreate={handleCreateTag} />
        </Field>
        {!initial && (
          <p className="text-xs text-slate-light">You'll add notes, checklists and links on the board after this.</p>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="mt-2 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{initial ? "Save changes" : "Create card"}</Button>
        </div>
      </div>
    </Modal>
  );
}
