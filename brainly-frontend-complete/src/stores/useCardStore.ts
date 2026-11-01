import { create } from "zustand";
import type { Card, Block, BlockColor, Connection } from "@/types";
import { NOTE_COLOR_CYCLE } from "@/lib/colors";
import { generateId } from "@/lib/id";
import { detectPlatform, deriveEmbedInfo, fetchWithTimeout } from "@/lib/platforms";
import { api, type BackendCard } from "@/services/api";

export interface NewCardInput {
  title: string;
  description: string;
  tagIds: string[];
}

interface CardStore {
  cards: Card[];
  loading: boolean;
  fetchCards: () => Promise<void>;
  getCard: (id: string) => Card | undefined;

  addCard: (input: NewCardInput) => Promise<string>;
  updateCardMeta: (id: string, patch: Partial<NewCardInput>) => Promise<void>;
  updateCardTitle: (id: string, title: string) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;

  addBlock: (cardId: string, type: "note" | "checklist" | "link") => void;
  deleteBlock: (cardId: string, blockId: string) => void;
  moveBlock: (cardId: string, blockId: string, x: number, y: number) => void;
  resizeBlock: (cardId: string, blockId: string, w: number, h: number) => void;
  changeBlockColor: (cardId: string, blockId: string, color: BlockColor) => void;

  changeNoteText: (cardId: string, blockId: string, text: string) => void;

  toggleChecklistItem: (cardId: string, blockId: string, itemId: string) => void;
  editChecklistItemText: (cardId: string, blockId: string, itemId: string, text: string) => void;
  addChecklistItem: (cardId: string, blockId: string) => void;
  deleteChecklistItem: (cardId: string, blockId: string, itemId: string) => void;

  changeEmbedTitle: (cardId: string, blockId: string, title: string) => void;
  changeEmbedUrl: (cardId: string, blockId: string, url: string) => void;

  pasteOntoBoard: (cardId: string, text: string) => void;

  addConnection: (cardId: string, from: string, to: string) => void;
  deleteConnection: (cardId: string, connectionId: string) => void;
  saveBoardState: (cardId: string) => void;
}

function parseCardFromBackend(bc: BackendCard): Card {
  let blocks: Block[] = [];
  let connections: Connection[] = [];

  if (bc.note) {
    try {
      const parsed = JSON.parse(bc.note);
      if (Array.isArray(parsed.blocks)) blocks = parsed.blocks;
      if (Array.isArray(parsed.connections)) connections = parsed.connections;
    } catch {
      // Plain text note: create a default note block
      blocks = [
        {
          id: `b_${Date.now()}`,
          type: "note",
          x: 40,
          y: 40,
          w: 240,
          h: 170,
          color: "blue",
          text: bc.note,
        },
      ];
    }
  }

  const createdDate = bc.createdAt
    ? bc.createdAt.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const history = (bc.editHistory || []).map((h) => ({
    name: h.userName || "You",
    at: h.timeStamp ? h.timeStamp.slice(0, 10) : createdDate,
  }));

  if (history.length === 0) {
    history.push({ name: "You", at: createdDate });
  }

  return {
    id: bc._id,
    title: bc.title,
    description: bc.description || "",
    tagIds: bc.tags || [],
    createdAt: createdDate,
    history,
    blocks,
    connections,
  };
}

export const useCardStore = create<CardStore>((set, get) => {
  function patchCard(cardId: string, patch: Partial<Card>) {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
    }));
  }

  function mapBlocks(cardId: string, updater: (blocks: Block[]) => Block[]) {
    const card = get().cards.find((c) => c.id === cardId);
    if (!card) return;
    const newBlocks = updater(card.blocks);
    patchCard(cardId, { blocks: newBlocks });
    get().saveBoardState(cardId);
  }

  let saveTimer: any = null;

  return {
    cards: [],
    loading: false,

    fetchCards: async () => {
      if (!api.isAuthenticated()) return;
      set({ loading: true });
      try {
        const backendCards = await api.getCards();
        const formatted = (backendCards || []).map(parseCardFromBackend);
        set({ cards: formatted, loading: false });
      } catch (err) {
        console.warn("Could not fetch cards from backend, using current state:", err);
        set({ loading: false });
      }
    },

    getCard: (id) => get().cards.find((c) => c.id === id),

    addCard: async (input) => {
      const today = new Date().toISOString().slice(0, 10);
      let newId = generateId("c");

      if (api.isAuthenticated()) {
        try {
          const res = await api.createCard({
            title: input.title,
            description: input.description,
            tags: input.tagIds,
          });
          if (res && res._id) {
            newId = res._id;
          }
        } catch (err) {
          console.error("Failed to create card on backend:", err);
        }
      }

      const newCard: Card = {
        id: newId,
        title: input.title,
        description: input.description,
        tagIds: input.tagIds,
        createdAt: today,
        history: [{ name: "You", at: today }],
        blocks: [],
        connections: [],
      };

      set((state) => ({ cards: [newCard, ...state.cards] }));
      return newId;
    },

    updateCardMeta: async (id, patch) => {
      patchCard(id, patch);
      if (api.isAuthenticated()) {
        try {
          await api.updateCard(id, {
            title: patch.title,
            description: patch.description,
            tags: patch.tagIds,
          });
        } catch (err) {
          console.error("Failed to update card metadata on backend:", err);
        }
      }
    },

    updateCardTitle: async (id, title) => {
      patchCard(id, { title });
      if (api.isAuthenticated()) {
        try {
          await api.updateCard(id, { title });
        } catch (err) {
          console.error("Failed to update card title on backend:", err);
        }
      }
    },

    deleteCard: async (id) => {
      set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }));
      if (api.isAuthenticated()) {
        try {
          await api.deleteCard(id);
        } catch (err) {
          console.error("Failed to delete card on backend:", err);
        }
      }
    },

    saveBoardState: (cardId: string) => {
      const card = get().cards.find((c) => c.id === cardId);
      if (!card || !api.isAuthenticated()) return;

      // Debounce saving board blocks to backend
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          const notePayload = JSON.stringify({
            blocks: card.blocks,
            connections: card.connections,
          });
          await api.updateCard(cardId, { note: notePayload });
        } catch (err) {
          console.error("Failed to save board state to backend:", err);
        }
      }, 1000);
    },

    addBlock: (cardId, type) => {
      const card = get().cards.find((c) => c.id === cardId);
      if (!card) return;
      const n = card.blocks.length;
      const offset = (n % 5) * 22;
      const id = generateId("b");
      let block: Block;
      if (type === "note") {
        block = {
          id,
          type: "note",
          x: 40 + offset,
          y: 40 + offset,
          w: 220,
          h: 150,
          color: NOTE_COLOR_CYCLE[n % NOTE_COLOR_CYCLE.length] || "blue",
          text: "",
        };
      } else if (type === "checklist") {
        block = {
          id,
          type: "checklist",
          x: 320 + offset,
          y: 40 + offset,
          w: 220,
          h: 170,
          color: "blue",
          title: "Checklist",
          items: [],
        };
      } else {
        block = {
          id,
          type: "embed",
          platform: "link",
          x: 40 + offset,
          y: 260 + offset,
          w: 230,
          h: 100,
          title: "",
          url: "",
          thumbnail: null,
        };
      }
      mapBlocks(cardId, (blocks) => [...blocks, block]);
    },

    deleteBlock: (cardId, blockId) => {
      mapBlocks(cardId, (blocks) => blocks.filter((b) => b.id !== blockId));
      const card = get().cards.find((c) => c.id === cardId);
      if (card) {
        patchCard(cardId, {
          connections: card.connections.filter((c) => c.from !== blockId && c.to !== blockId),
        });
        get().saveBoardState(cardId);
      }
    },

    moveBlock: (cardId, blockId, x, y) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) => (b.id === blockId ? { ...b, x: Math.max(0, x), y: Math.max(0, y) } : b))
      );
    },

    resizeBlock: (cardId, blockId, w, h) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) => (b.id === blockId ? { ...b, w: Math.max(140, w), h: Math.max(90, h) } : b))
      );
    },

    changeBlockColor: (cardId, blockId, color) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) =>
          b.id === blockId && (b.type === "note" || b.type === "checklist") ? { ...b, color } : b
        )
      );
    },

    changeNoteText: (cardId, blockId, text) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) => (b.id === blockId && b.type === "note" ? { ...b, text } : b))
      );
    },

    toggleChecklistItem: (cardId, blockId, itemId) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) =>
          b.id === blockId && b.type === "checklist"
            ? { ...b, items: b.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)) }
            : b
        )
      );
    },

    editChecklistItemText: (cardId, blockId, itemId, text) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) =>
          b.id === blockId && b.type === "checklist"
            ? { ...b, items: b.items.map((it) => (it.id === itemId ? { ...it, text } : it)) }
            : b
        )
      );
    },

    addChecklistItem: (cardId, blockId) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) =>
          b.id === blockId && b.type === "checklist"
            ? { ...b, items: [...b.items, { id: generateId("i"), text: "", done: false }] }
            : b
        )
      );
    },

    deleteChecklistItem: (cardId, blockId, itemId) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) =>
          b.id === blockId && b.type === "checklist"
            ? { ...b, items: b.items.filter((it) => it.id !== itemId) }
            : b
        )
      );
    },

    changeEmbedTitle: (cardId, blockId, title) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) => (b.id === blockId && b.type === "embed" ? { ...b, title } : b))
      );
    },

    changeEmbedUrl: (cardId, blockId, url) => {
      mapBlocks(cardId, (blocks) =>
        blocks.map((b) => (b.id === blockId && b.type === "embed" ? { ...b, url } : b))
      );
    },

    pasteOntoBoard: (cardId, text) => {
      const card = get().cards.find((c) => c.id === cardId);
      if (!card) return;
      const n = card.blocks.length;
      const offset = (n % 5) * 22;
      const isUrl = /^https?:\/\/\S+$/i.test(text);

      if (!isUrl) {
        const block: Block = {
          id: generateId("b"),
          type: "note",
          x: 40 + offset,
          y: 40 + offset,
          w: 220,
          h: 150,
          color: NOTE_COLOR_CYCLE[n % NOTE_COLOR_CYCLE.length] || "blue",
          text,
        };
        mapBlocks(cardId, (blocks) => [...blocks, block]);
        return;
      }

      const platform = detectPlatform(text);
      const info = deriveEmbedInfo(text, platform);
      const id = generateId("b");
      const block: Block = {
        id,
        type: "embed",
        platform,
        url: text,
        x: 40 + offset,
        y: 40 + offset,
        w: 240,
        h: platform === "youtube" ? 195 : 100,
        title: info.title,
        thumbnail: info.thumbnail,
      };
      mapBlocks(cardId, (blocks) => [...blocks, block]);

      if (platform === "youtube") {
        fetchWithTimeout(`https://noembed.com/embed?url=${encodeURIComponent(text)}`, 4000)
          .then((res) => res.json())
          .then((data: { title?: string }) => get().changeEmbedTitle(cardId, id, data.title || "YouTube video"))
          .catch(() => get().changeEmbedTitle(cardId, id, "YouTube video"));
      }
    },

    addConnection: (cardId, from, to) => {
      const card = get().cards.find((c) => c.id === cardId);
      if (!card || from === to) return;
      const exists = card.connections.some(
        (c) => (c.from === from && c.to === to) || (c.from === to && c.to === from)
      );
      if (exists) return;
      const connection: Connection = { id: generateId("x"), from, to };
      patchCard(cardId, { connections: [...card.connections, connection] });
      get().saveBoardState(cardId);
    },

    deleteConnection: (cardId, connectionId) => {
      const card = get().cards.find((c) => c.id === cardId);
      if (!card) return;
      patchCard(cardId, { connections: card.connections.filter((c) => c.id !== connectionId) });
      get().saveBoardState(cardId);
    },
  };
});
