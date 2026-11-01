import { create } from "zustand";
import { api, type BackendSearchResult } from "@/services/api";

interface AIStore {
  query: string;
  answer: string | null;
  sources: BackendSearchResult[];
  loading: boolean;
  error: string | null;

  setQuery: (q: string) => void;
  askAI: (query: string) => Promise<void>;
  clear: () => void;
}

export const useAIStore = create<AIStore>((set) => ({
  query: "",
  answer: null,
  sources: [],
  loading: false,
  error: null,

  setQuery: (q) => set({ query: q }),

  askAI: async (query) => {
    if (!query.trim()) return;
    set({ loading: true, error: null, answer: null, sources: [] });
    try {
      const data = await api.aiQuery(query.trim());
      set({
        answer: data.answer,
        sources: data.sources || [],
        loading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || "Failed to ask AI. Please check your connection.",
        loading: false,
      });
    }
  },

  clear: () => set({ query: "", answer: null, sources: [], error: null }),
}));
