import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useCardStore } from "@/stores/useCardStore";
import { useTagStore } from "@/stores/useTagStore";
import { TopBar } from "@/components/layout";

export default function TagsPage() {
  const navigate = useNavigate();
  const cards = useCardStore((s) => s.cards);
  const fetchCards = useCardStore((s) => s.fetchCards);
  const tags = useTagStore((s) => s.tags);
  const fetchTags = useTagStore((s) => s.fetchTags);

  useEffect(() => {
    fetchTags();
    fetchCards();
  }, [fetchTags, fetchCards]);

  return (
    <div className="flex-1 overflow-y-auto px-10 py-9">
      <TopBar title="Tags" subtitle="Browse your brain by topic." />

      {tags.length === 0 ? (
        <p className="text-sm text-slate">No tags yet. Create one from the "Add card" form.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {tags.map((tag) => {
            const tagCards = cards.filter((c) => c.tagIds.includes(tag.id));
            return (
              <button
                key={tag.id}
                onClick={() => navigate(`/cards?tag=${tag.id}`)}
                className="flex flex-col gap-3 rounded-xl border border-line bg-white p-5 text-left transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-3 py-1 text-sm font-medium"
                    style={{ backgroundColor: tag.bg, color: tag.color }}
                  >
                    {tag.name}
                  </span>
                  <span className="font-mono text-xs text-slate-light">
                    {tagCards.length} card{tagCards.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {tagCards.slice(0, 2).map((c) => (
                    <div key={c.id} className="truncate text-xs text-slate">
                      {c.title}
                    </div>
                  ))}
                  {tagCards.length === 0 && (
                    <div className="text-xs text-slate-light">No cards tagged {tag.name} yet.</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
