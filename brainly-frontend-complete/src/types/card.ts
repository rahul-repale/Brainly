import type { Block, Connection } from "./block";

export interface EditHistoryEntry {
  name: string;
  at: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  tagIds: string[];
  createdAt: string;
  history: EditHistoryEntry[];
  blocks: Block[];
  connections: Connection[];
}
