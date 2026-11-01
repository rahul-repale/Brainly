import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useCardStore } from "@/stores/useCardStore";
import { useTagStore } from "@/stores/useTagStore";
import { TopBar } from "@/components/layout";
import { CardTile, CardFormModal } from "@/components/cards";
import { TagPill } from "@/components/ui";

export default function AllCardsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cards = useCardStore((s) => s.cards);
  const addCard = useCardStore((s) => s.addCard);
  const fetchCards = useCardStore((s) => s.fetchCards);
  const tags = useTagStore((s) => s.tags);
  const createTag = useTagStore((s) => s.createTag);
  const fetchTags = useTagStore((s) => s.fetchTags);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(searchParams.get("tag"));
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCards();
    fetchTags();
  }, [fetchCards, fetchTags]);

  const filtered = cards.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !tagFilter || c.tagIds.includes(tagFilter);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex-1 overflow-y-auto px-10 py-9">
      <TopBar
        title="All Cards"
        subtitle={`${cards.length} cards saved`}
        search={search}
        onSearch={setSearch}
        onAdd={() => setShowAddModal(true)}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <TagPill
          tag={{ name: "All", color: "#6B6B76", bg: "#EFEDF3" }}
          active={!tagFilter}
          onClick={() => setTagFilter(null)}
        />
        {tags.map((t) => (
          <TagPill key={t.id} tag={t} active={tagFilter === t.id} onClick={() => setTagFilter(t.id)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-20 text-center text-slate">
          <p className="text-sm">Nothing matches "{search}" yet. Try a different word or clear the filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {filtered.map((c) => (
            <CardTile key={c.id} card={c} allTags={tags} onOpen={() => navigate(`/board/${c.id}`)} />
          ))}
        </div>
      )}

      {showAddModal && (
        <CardFormModal
          initial={null}
          allTags={tags}
          onCreateTag={createTag}
          onSave={(data) => {
            addCard(data);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
