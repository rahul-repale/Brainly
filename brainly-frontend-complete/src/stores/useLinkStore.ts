import { create } from "zustand";
import type { ShareLink, LinkPermission, LinkTargetType } from "@/types";
import { INITIAL_LINKS } from "@/lib/mockData";
import { generateId } from "@/lib/id";
import { api } from "@/services/api";

interface LinkStore {
  links: ShareLink[];
  loading: boolean;
  fetchLinks: () => Promise<void>;
  createLink: (target: string, permission: LinkPermission) => Promise<string | undefined>;
  revokeLink: (id: string) => Promise<void>;
  incrementClicks: (id: string) => void;
}

export const useLinkStore = create<LinkStore>((set) => ({
  links: INITIAL_LINKS,
  loading: false,

  fetchLinks: async () => {
    if (!api.isAuthenticated()) return;
    set({ loading: true });
    try {
      const res = await api.getShareLinks();
      if (res && res.links && res.links.length > 0) {
        const formatted: ShareLink[] = res.links.map((bl) => ({
          id: bl._id,
          targetType: bl.targetType,
          cardId: bl.targetedAt || null,
          permission: bl.permission,
          clicks: bl.clickCount || 0,
          expiresAt: bl.expiresAt ? bl.expiresAt.slice(0, 10) : "Never",
          token: bl.token || bl._id,
        }));
        set({ links: formatted, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  createLink: async (target, permission) => {
    const targetType: LinkTargetType = target === "brain" ? "brain" : "card";
    let token = Math.random().toString(16).slice(2, 10);
    let linkId = generateId("l");
    let expiresAt = "30 days";

    if (api.isAuthenticated()) {
      try {
        const res = await api.createShareLink({
          type: targetType,
          cardId: targetType === "card" ? target : undefined,
          permission,
        });
        if (res && res.token) {
          token = res.token;
          linkId = res.token;
          expiresAt = res.expiresAt ? res.expiresAt.slice(0, 10) : "Never";
        }
      } catch (err) {
        console.error("Failed to create share link on backend:", err);
      }
    }

    const newLink: ShareLink = {
      id: linkId,
      targetType,
      cardId: targetType === "brain" ? null : target,
      permission,
      clicks: 0,
      expiresAt,
      token,
    };
    set((state) => ({ links: [newLink, ...state.links] }));
    return token;
  },

  revokeLink: async (id) => {
    set((state) => ({ links: state.links.filter((l) => l.id !== id) }));
    if (api.isAuthenticated()) {
      try {
        await api.revokeShareLink(id);
      } catch (err) {
        console.error("Failed to revoke share link on backend:", err);
      }
    }
  },

  incrementClicks: (id) =>
    set((state) => ({
      links: state.links.map((l) => (l.id === id ? { ...l, clicks: l.clicks + 1 } : l)),
    })),
}));
