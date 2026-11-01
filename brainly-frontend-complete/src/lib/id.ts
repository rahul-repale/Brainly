/**
 * Generates a reasonably-unique id for client-side-created records
 * (cards, blocks, tags, links, connections) before they ever touch a database.
 * Once the backend is wired up in Phase 2, server-assigned Mongo _ids take over
 * for anything persisted — this stays useful for ephemeral local state either way.
 */
export function generateId(prefix: string): string {
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}${Date.now()}${random}`;
}
