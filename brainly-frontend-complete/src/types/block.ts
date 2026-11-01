export type BlockColor = "yellow" | "pink" | "blue" | "green" | "purple";

export interface NoteBlock {
  id: string;
  type: "note";
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  text: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ChecklistBlock {
  id: string;
  type: "checklist";
  x: number;
  y: number;
  w: number;
  h: number;
  color: BlockColor;
  title: string;
  items: ChecklistItem[];
}

export type Platform =
  | "youtube"
  | "twitter"
  | "claude"
  | "chatgpt"
  | "gemini"
  | "instagram"
  | "linkedin"
  | "reddit"
  | "tiktok"
  | "github"
  | "article"
  | "link";

export interface EmbedBlock {
  id: string;
  type: "embed";
  x: number;
  y: number;
  w: number;
  h: number;
  platform: Platform;
  url: string;
  title: string;
  thumbnail: string | null;
}

// The discriminated union — checking `block.type` narrows to the right shape everywhere.
export type Block = NoteBlock | ChecklistBlock | EmbedBlock;

export interface Connection {
  id: string;
  from: string;
  to: string;
}
