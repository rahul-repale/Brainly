import {
  Play,
  MessageCircle,
  Sparkles,
  MessageSquare,
  Wand2,
  Image,
  Briefcase,
  Users,
  Music2,
  Code2,
  Newspaper,
  Link2,
} from "lucide-react";
import type { Platform } from "@/types";
import type { LucideIcon } from "lucide-react";

/**
 * Generic (non-brand) icon per platform. Lucide v1.0 removed all trademarked
 * brand/logo icons (GitHub, X, Instagram, etc.) for licensing reasons, so this
 * leans on color + label (see lib/platforms.ts PLATFORM_META) as the primary
 * identifier, with a generic icon as a secondary visual accent.
 */
export const PLATFORM_ICONS: Record<Platform, LucideIcon> = {
  youtube: Play,
  twitter: MessageCircle,
  claude: Sparkles,
  chatgpt: MessageSquare,
  gemini: Wand2,
  instagram: Image,
  linkedin: Briefcase,
  reddit: Users,
  tiktok: Music2,
  github: Code2,
  article: Newspaper,
  link: Link2,
};
