import type { BlockColor } from "@/types/block";

export const NOTE_COLORS: Record<BlockColor, { bg: string; header: string }> = {
  yellow: { bg: "#FFF3C4", header: "#F5E48F" },
  pink: { bg: "#FCE2EC", header: "#F7C6DC" },
  blue: { bg: "#DCEBFF", header: "#BCD8F7" },
  green: { bg: "#DFF5E1", header: "#C0E8C5" },
  purple: { bg: "#EAE2FB", header: "#D6C6F5" },
};

export const NOTE_COLOR_CYCLE: BlockColor[] = ["yellow", "pink", "blue", "green", "purple"];

// Shared text color for checklist titles/items — pastel headers are all light
// enough that one dark neutral reads fine regardless of which color is picked.
export const CHECKLIST_TEXT = "#3A3550";

// Auto-assigned to new tags in rotation (see useTagStore in Step 3).
export const TAG_COLOR_PALETTE: { color: string; bg: string }[] = [
  { color: "#2854C8", bg: "#E6EEFE" },
  { color: "#15803D", bg: "#E1F5E8" },
  { color: "#BE185D", bg: "#FCE7F3" },
  { color: "#B45309", bg: "#FDF0DA" },
  { color: "#5B4FD6", bg: "#ECE8FF" },
  { color: "#0F766E", bg: "#DDF4F1" },
  { color: "#9333EA", bg: "#F3E8FF" },
  { color: "#C2410C", bg: "#FFE9DD" },
];
