import type { Platform } from "@/types/block";

interface PlatformMeta {
  label: string;
  color: string;
  bg: string;
}

// Icon components are intentionally NOT here — lib/ stays React-free.
// The Platform -> icon-component mapping lives in components/board (Step 6).
export const PLATFORM_META: Record<Platform, PlatformMeta> = {
  youtube: { label: "YouTube", color: "#D93025", bg: "#FDE9E7" },
  twitter: { label: "X (Twitter)", color: "#0F1419", bg: "#E8EAED" },
  claude: { label: "Claude", color: "#B85C38", bg: "#FBEDE5" },
  chatgpt: { label: "ChatGPT", color: "#10A37F", bg: "#E1F5EE" },
  gemini: { label: "Gemini", color: "#4285F4", bg: "#E8F0FE" },
  instagram: { label: "Instagram", color: "#C1326B", bg: "#FBE7F0" },
  linkedin: { label: "LinkedIn", color: "#0A66C2", bg: "#E5F1FB" },
  reddit: { label: "Reddit", color: "#CC3D00", bg: "#FFE9DF" },
  tiktok: { label: "TikTok", color: "#111111", bg: "#EDEDED" },
  github: { label: "GitHub", color: "#171515", bg: "#EDEDED" },
  article: { label: "Article", color: "#57534E", bg: "#F0EEEC" },
  link: { label: "Link", color: "#5B4FD6", bg: "#ECE8FF" },
};

/**
 * Classifies a URL by platform via pattern matching. Always returns a real
 * Platform (falls back to "article") — callers don't need to handle a null case.
 * "link" is never returned here; it's reserved for manually-created blocks
 * that start with an empty, user-typed URL.
 */
export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (/youtu\.be\/|youtube\.com\/(watch|shorts)/.test(u)) return "youtube";
  if (/(^|\/\/)(www\.)?(twitter\.com|x\.com)\//.test(u)) return "twitter";
  if (/claude\.ai\/share\//.test(u)) return "claude";
  if (/chatgpt\.com\/share\/|chat\.openai\.com\/share\//.test(u)) return "chatgpt";
  if (/gemini\.google\.com\/share\//.test(u)) return "gemini";
  if (/instagram\.com\//.test(u)) return "instagram";
  if (/linkedin\.com\//.test(u)) return "linkedin";
  if (/reddit\.com\//.test(u)) return "reddit";
  if (/tiktok\.com\//.test(u)) return "tiktok";
  if (/github\.com\//.test(u)) return "github";
  return "article";
}

export interface EmbedInfo {
  title: string;
  thumbnail: string | null;
}

/**
 * Derives a synchronous best-guess title + thumbnail from the URL structure
 * alone. YouTube's title gets overwritten shortly after by a real oEmbed
 * fetch (see fetchWithTimeout below) — everything else stays as-is, since no
 * CORS-friendly metadata API exists for these without a backend proxy.
 */
export function deriveEmbedInfo(url: string, platform: Platform): EmbedInfo {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    switch (platform) {
      case "youtube": {
        const id = u.searchParams.get("v") || parts[parts.length - 1];
        return {
          title: "Loading title...",
          thumbnail: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null,
        };
      }
      case "twitter":
        return { title: parts[0] ? `Post by @${parts[0]}` : "Post on X", thumbnail: null };
      case "claude":
        return { title: "Shared Claude conversation", thumbnail: null };
      case "chatgpt":
        return { title: "Shared ChatGPT conversation", thumbnail: null };
      case "gemini":
        return { title: "Shared Gemini conversation", thumbnail: null };
      case "instagram":
        return { title: "Instagram post", thumbnail: null };
      case "linkedin":
        return { title: "LinkedIn post", thumbnail: null };
      case "reddit": {
        const rIdx = parts.indexOf("r");
        return {
          title: rIdx >= 0 && parts[rIdx + 1] ? `r/${parts[rIdx + 1]}` : "Reddit post",
          thumbnail: null,
        };
      }
      case "tiktok":
        return { title: "TikTok video", thumbnail: null };
      case "github":
        return { title: parts.length >= 2 ? `${parts[0]}/${parts[1]}` : u.hostname, thumbnail: null };
      case "article":
        return { title: u.hostname.replace("www.", ""), thumbnail: null };
      default:
        return { title: url, thumbnail: null };
    }
  } catch {
    return { title: url, thumbnail: null };
  }
}

/** Races a fetch against a timeout so a stalled request can't hang the UI forever. */
export function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  return Promise.race([
    fetch(url),
    new Promise<Response>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}
