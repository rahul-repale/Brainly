import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { Plus, Layers, Tag as TagIcon, Eye, Clock, Copy, Check, ExternalLink, Trash2 } from "lucide-react";
import { useCardStore } from "@/stores/useCardStore";
import { useLinkStore } from "@/stores/useLinkStore";
import { TopBar } from "@/components/layout";
import { Button } from "@/components/ui";
import type { LinkPermission } from "@/types";

export default function SharedLinksPage() {
  const navigate = useNavigate();
  const cards = useCardStore((s) => s.cards);
  const links = useLinkStore((s) => s.links);
  const createLink = useLinkStore((s) => s.createLink);
  const revokeLink = useLinkStore((s) => s.revokeLink);
  const fetchLinks = useLinkStore((s) => s.fetchLinks);

  const [target, setTarget] = useState("brain");
  const [permission, setPermission] = useState<LinkPermission>("view");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  function copy(token: string, id: string) {
    try {
      navigator.clipboard.writeText(`${window.location.origin}/share/${token}`);
    } catch {
      // clipboard access denied — non-fatal
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="flex-1 overflow-y-auto px-10 py-9">
      <TopBar title="Shared Links" subtitle="Give someone a read-only or editable copy." />

      <div className="mb-8 rounded-xl border border-line bg-white p-5">
        <h3 className="mb-3.5 text-sm font-semibold text-ink">Share something new</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate">What to share</span>
            <select
              value={target}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setTarget(e.target.value)}
              className="min-w-[220px] rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink"
            >
              <option value="brain">Entire brain</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate">Permission</span>
            <div className="flex gap-2">
              {(["view", "edit"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPermission(p)}
                  className={`rounded-lg border px-3.5 py-2.5 text-sm font-medium ${
                    permission === p ? "border-brand-tint bg-brand-tint text-brand" : "border-line bg-white text-slate"
                  }`}
                >
                  {p === "view" ? "View only" : "Can edit"}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => createLink(target, permission)}>
            <Plus size={16} /> Create link
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {links.map((l) => {
          const card = cards.find((c) => c.id === l.cardId);
          const label = l.targetType === "brain" ? "Entire brain" : (card?.title ?? "Deleted card");
          return (
            <div
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white p-4"
            >
              <div className="flex min-w-[220px] items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-paper">
                  {l.targetType === "brain" ? (
                    <Layers size={16} className="text-brand" />
                  ) : (
                    <TagIcon size={16} className="text-brand" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{label}</div>
                  <div className="font-mono text-xs text-slate-light">/{l.token}</div>
                </div>
              </div>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: l.permission === "view" ? "#E1F5E8" : "#FDF0DA",
                  color: l.permission === "view" ? "#15803D" : "#B45309",
                }}
              >
                {l.permission === "view" ? "View only" : "Can edit"}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs text-slate">
                <Eye size={13} /> {l.clicks} clicks
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs text-slate">
                <Clock size={13} /> expires {l.expiresAt}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => copy(l.token, l.id)} className="rounded-lg p-2 hover:bg-gray-100" title="Copy link">
                  {copiedId === l.id ? <Check size={15} className="text-green-700" /> : <Copy size={15} className="text-slate" />}
                </button>
                <button
                  onClick={() => navigate(`/share/${l.token}`)}
                  className="rounded-lg p-2 hover:bg-gray-100"
                  title="Preview as visitor"
                >
                  <ExternalLink size={15} className="text-slate" />
                </button>
                <button onClick={() => revokeLink(l.id)} className="rounded-lg p-2 hover:bg-gray-100" title="Revoke">
                  <Trash2 size={15} className="text-danger" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
