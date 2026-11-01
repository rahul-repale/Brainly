import { create } from "zustand";
import { api } from "@/services/api";

interface AuthStore {
  isAuthenticated: boolean;
  username: string | null;
  loading: boolean;
  error: string | null;

  signIn: (username: string, password: string) => Promise<boolean>;
  signUp: (username: string, password: string, email: string, age: number) => Promise<boolean>;
  signOut: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: api.isAuthenticated(),
  username: localStorage.getItem("username"),
  loading: false,
  error: null,

  signIn: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.signIn({ username, password });
      const user = res.username || username;
      localStorage.setItem("username", user);
      set({ isAuthenticated: true, username: user, loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to sign in", loading: false });
      return false;
    }
  },

  signUp: async (username, password, email, age) => {
    set({ loading: true, error: null });
    try {
      await api.signUp({ username, password, email, age });
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message || "Failed to sign up", loading: false });
      return false;
    }
  },

  signOut: () => {
    api.signOut();
    set({ isAuthenticated: false, username: null });
  },

  clearError: () => set({ error: null }),
}));
