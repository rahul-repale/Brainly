const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface BackendCard {
  _id: string;
  createdBy: string;
  title: string;
  description?: string;
  note?: string;
  tags?: string[];
  editHistory?: {
    userId?: string;
    userName: string;
    timeStamp?: string;
  }[];
  createdAt?: string;
}

export interface BackendTag {
  _id: string;
  tagName: string;
}

export interface BackendSearchResult {
  _id: string;
  title: string;
  description?: string;
  note?: string;
  score: number;
}

export interface BackendShareLink {
  _id: string;
  token?: string;
  targetType: "card" | "brain";
  targetedAt?: string;
  permission: "view" | "edit";
  expiresAt: string | null;
  clickCount: number;
  createdAt: string;
}

export interface AIQueryResponse {
  answer: string;
  sources: BackendSearchResult[];
}

export interface SharedBrainResponse {
  type: "card" | "brain";
  permission: "view" | "edit";
  card?: {
    title: string;
    description?: string;
    note?: string;
    tags?: string[];
  };
  cards?: {
    _id?: string;
    title: string;
    description?: string;
    note?: string;
    tags?: string[];
  }[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("token");
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem("token");
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = token;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Don't auto-redirect if on login or share pages
      const isPublicPath = window.location.pathname === "/" || 
                           window.location.pathname === "/signup" || 
                           window.location.pathname.startsWith("/share");
      if (!isPublicPath) {
        this.setToken(null);
        localStorage.removeItem("username");
        window.location.href = "/";
      }
      throw new Error("Session expired. Please sign in again.");
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      const msg = data.msg || data.err || (Array.isArray(data) ? data[0]?.message : "Request failed");
      throw new Error(msg || `Request failed with status ${res.status}`);
    }

    return data as T;
  }

  // --- Auth Endpoints ---
  async signUp(body: { username: string; password: string; email: string; age: number }) {
    return this.request<{ msg: string }>("/user/v1/signup", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async signIn(body: { username: string; password: string }) {
    const data = await this.request<{ msg: string; token: string; username?: string }>("/user/v1/signin", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  signOut() {
    this.setToken(null);
    localStorage.removeItem("username");
  }

  // --- Cards Endpoints ---
  async getCards() {
    return this.request<BackendCard[]>("/user/v1/content", { method: "GET" });
  }

  async createCard(body: { title: string; description?: string; tags?: string[]; note?: string }) {
    return this.request<BackendCard>("/user/v1/content", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async updateCard(cardId: string, updatedCard: Partial<BackendCard>) {
    return this.request<{ msg: string; card?: BackendCard }>("/user/v1/content", {
      method: "PUT",
      body: JSON.stringify({ cardId, updatedCard }),
    });
  }

  async deleteCard(cardId: string) {
    return this.request<{ msg: string }>("/user/v1/content", {
      method: "DELETE",
      body: JSON.stringify({ cardId }),
    });
  }

  // --- Tag Endpoints ---
  async getTags() {
    return this.request<BackendTag[]>("/user/v1/tags", { method: "GET" });
  }

  async createTag(tagName: string) {
    return this.request<BackendTag>("/user/v1/tags", {
      method: "POST",
      body: JSON.stringify({ tagName }),
    });
  }

  // --- Search Endpoints ---
  async querySearch(query: string, limit = 10, minScore?: number) {
    return this.request<{ results: BackendSearchResult[] }>("/user/v1/query", {
      method: "POST",
      body: JSON.stringify({ query, limit, minScore }),
    });
  }

  // --- RAG / AI Query Endpoint ---
  async aiQuery(query: string, limit = 5) {
    return this.request<AIQueryResponse>("/user/v1/ai-query", {
      method: "POST",
      body: JSON.stringify({ query, limit }),
    });
  }

  // --- Share Links Endpoints ---
  async createShareLink(body: {
    type: "card" | "brain";
    cardId?: string;
    permission?: "view" | "edit";
    expiresInDays?: number | null;
  }) {
    return this.request<{
      token: string;
      permission: string;
      expiresAt: string | null;
      shareUrl: string;
    }>("/user/v1/share", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getShareLinks() {
    return this.request<{ links: BackendShareLink[] }>("/user/v1/share", { method: "GET" });
  }

  async revokeShareLink(linkId: string) {
    return this.request<{ msg: string }>(`/user/v1/share/${linkId}`, {
      method: "DELETE",
    });
  }

  async fetchSharedContent(token: string) {
    return this.request<SharedBrainResponse>(`/user/v1/share/${token}`, { method: "GET" });
  }

  async editSharedCard(token: string, body: { title?: string; description?: string; note?: string; tags?: string[] }) {
    return this.request<{ msg: string; card: any }>(`/user/v1/share/${token}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiService();
