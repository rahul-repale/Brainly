import { create } from "zustand";
import type { Tag } from "@/types";
import { INITIAL_TAGS } from "@/lib/mockData";
import { TAG_COLOR_PALETTE } from "@/lib/colors";
import { api } from "@/services/api";

interface TagStore {
  tags: Tag[];
  loading: boolean;
  fetchTags: () => Promise<void>;
  createTag: (name: string) => Promise<string | null>;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: INITIAL_TAGS,
  loading: false,

  fetchTags: async () => {
    if (!api.isAuthenticated()) return;
    set({ loading: true });
    try {
      const backendTags = await api.getTags();
      if (backendTags && backendTags.length > 0) {
        const formatted: Tag[] = backendTags.map((bt, index) => {
          const palette = TAG_COLOR_PALETTE[index % TAG_COLOR_PALETTE.length] || {
            color: "#5B4FD6",
            bg: "#ECE8FF",
          };
          return {
            id: bt._id,
            name: bt.tagName,
            color: palette.color,
            bg: palette.bg,
          };
        });
        set({ tags: formatted, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  createTag: async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const existing = get().tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    const palette = TAG_COLOR_PALETTE[get().tags.length % TAG_COLOR_PALETTE.length] || {
      color: "#5B4FD6",
      bg: "#ECE8FF",
    };

    if (api.isAuthenticated()) {
      try {
        const newTag = await api.createTag(trimmed);
        const tagObj: Tag = {
          id: newTag._id,
          name: newTag.tagName,
          ...palette,
        };
        set((state) => ({ tags: [...state.tags, tagObj] }));
        return newTag._id;
      } catch (err) {
        console.error("Failed to create tag on backend:", err);
      }
    }

    // Fallback local id
    const localId = `t_${Date.now()}`;
    set((state) => ({ tags: [...state.tags, { id: localId, name: trimmed, ...palette }] }));
    return localId;
  },
}));
