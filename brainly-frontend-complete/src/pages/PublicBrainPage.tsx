import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useCardStore } from "@/stores/useCardStore";
import { useTagStore } from "@/stores/useTagStore";
import { useLinkStore } from "@/stores/useLinkStore";
import { BrainMark, TagPill, Button } from "@/components/ui";
import { CardTile } from "@/components/cards";
import { ReadOnlyBlockPreview } from "@/components/board";
import { api, type SharedBrainResponse } from "@/services/api";
import type { Tag, Card } from "@/types";

export default function PublicBrainPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const links = useLinkStore((s) => s.links);
  const incrementClicks = useLinkStore((s) => s.incrementClicks);
  const cards = useCardStore((s) => s.cards);
  const tags = useTagStore((s) => s.tags);

  const localLink = links.find((l) => l.token === token);
  const countedRef = useRef(false);

  const [remoteData, setRemoteData] = useState<SharedBrainResponse | null>(null);
  const [loading, setLoading] = useState(!localLink);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (localLink && !countedRef.current) {
      countedRef.current = true;
      incrementClicks(localLink.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localLink?.id]);

  useEffect(() => {
    if (token && !localLink) {
      setLoading(true);
      api
        .fetchSharedContent(token)
        .then((res) => {
          setRemoteData(res);
          setLoading(false);
        })
        .catch(() => {
          setError(true);
          setLoading(false);
        });
    }
  }, [token, localLink]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm text-slate">Loading shared brain...</p>
      </div>
    );
  }

  if (error || (!localLink && !remoteData)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-center">
          <p className="text-base font-semibold text-ink">This link doesn't exist or has expired.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-3 text-sm font-semibold text-brand hover:underline"
          >
            Go to Brainly Home
          </button>
        </div>
      </div>
    );
  }

  // Display remote or local content
  const permission = remoteData ? remoteData.permission : localLink?.permission;
  const isBrain = remoteData ? remoteData.type === "brain" : localLink?.targetType === "brain";

  // Card view
  let singleCard: Card | null = null;
  if (!isBrain) {
    if (remoteData?.card) {
      singleCard = {
        id: "shared-c",
        title: remoteData.card.title,
        description: remoteData.card.description || "",
        tagIds: remoteData.card.tags || [],
        createdAt: "Shared",
        history: [],
        blocks: remoteData.card.note
          ? [
              {
                id: "sb1",
                type: "note",
                x: 40,
                y: 40,
                w: 240,
                h: 170,
                color: "blue",
                text: remoteData.card.note,
              },
            ]
          : [],
        connections: [],
      };
    } else if (localLink) {
      singleCard = cards.find((c) => c.id === localLink.cardId) || null;
    }
  }

  const cardTags = singleCard
    ? singleCard.tagIds.map((id) => tags.find((t) => t.id === id)).filter((t): t is Tag => Boolean(t))
    : [];

  const displayCards: Card[] = remoteData?.cards
    ? remoteData.cards.map((rc, idx) => ({
        id: rc._id || `rc_${idx}`,
        title: rc.title,
        description: rc.description || "",
        tagIds: rc.tags || [],
        createdAt: "Shared",
        history: [],
        blocks: [],
        connections: [],
      }))
    : cards;

  return (
    <div className="min-h-screen bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-10 py-5">
        <div className="flex items-center gap-2.5">
          <BrainMark size={24} />
          <span className="font-display text-base font-bold text-ink">Shared Brain</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: permission === "view" ? "#E1F5E8" : "#FDF0DA",
              color: permission === "view" ? "#15803D" : "#B45309",
            }}
          >
            {permission === "view" ? "View only" : "Can edit"}
          </span>
          <Button onClick={() => navigate("/signup")}>Create your own</Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-10 py-9">
        {singleCard ? (
          <div className="relative rounded-2xl border border-line bg-white p-7">
            <span
              className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl"
              style={{ backgroundColor: cardTags[0]?.color ?? "#A6A3B0" }}
            />
            <div className="flex flex-wrap gap-1.5">
              {cardTags.map((t) => (
                <TagPill key={t.id} tag={t} />
              ))}
            </div>
            <h1 className="mt-3.5 font-display text-2xl font-bold text-ink">{singleCard.title}</h1>
            <p className="mt-2 text-sm text-slate">{singleCard.description}</p>
            <div className="my-5 h-px bg-line" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {singleCard.blocks.map((b) => (
                <ReadOnlyBlockPreview key={b.id} block={b} />
              ))}
            </div>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate">{displayCards.length} cards shared with you.</p>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {displayCards.map((c) => (
                <CardTile key={c.id} card={c} allTags={tags} readOnly />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
