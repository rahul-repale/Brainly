import { useState, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { Plus, Tag as TagIcon, Share2, Layers, Sparkles, Brain, Search, Loader2, ArrowRight } from "lucide-react";
import { useCardStore } from "@/stores/useCardStore";
import { useTagStore } from "@/stores/useTagStore";
import { useLinkStore } from "@/stores/useLinkStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAIStore } from "@/stores/useAIStore";
import { TopBar } from "@/components/layout";
import { CardTile, CardFormModal } from "@/components/cards";

export default function DashboardPage() {
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username) || "Friend";

  const cards = useCardStore((s) => s.cards);
  const addCard = useCardStore((s) => s.addCard);
  const fetchCards = useCardStore((s) => s.fetchCards);

  const tags = useTagStore((s) => s.tags);
  const createTag = useTagStore((s) => s.createTag);
  const fetchTags = useTagStore((s) => s.fetchTags);

  const links = useLinkStore((s) => s.links);
  const fetchLinks = useLinkStore((s) => s.fetchLinks);

  const [showAddModal, setShowAddModal] = useState(false);

  // AI RAG search state
  const aiQuery = useAIStore((s) => s.query);
  const setAIQuery = useAIStore((s) => s.setQuery);
  const askAI = useAIStore((s) => s.askAI);
  const aiAnswer = useAIStore((s) => s.answer);
  const aiSources = useAIStore((s) => s.sources);
  const aiLoading = useAIStore((s) => s.loading);
  const aiError = useAIStore((s) => s.error);
  const clearAI = useAIStore((s) => s.clear);

  useEffect(() => {
    fetchCards();
    fetchTags();
    fetchLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAISearch(e?: KeyboardEvent<HTMLInputElement>) {
    if (e && e.key !== "Enter") return;
    if (!aiQuery.trim() || aiLoading) return;
    askAI(aiQuery);
  }

  const recent = cards.slice(0, 6);

  const quickActions = [
    { label: "Add a card", desc: "Save a link, note or tweet", icon: Plus, action: () => setShowAddModal(true) },
    { label: "Browse tags", desc: "See everything by topic", icon: TagIcon, action: () => navigate("/tags") },
    { label: "Share your brain", desc: "Create a read-only link", icon: Share2, action: () => navigate("/links") },
    { label: "All cards", desc: `${cards.length} saved so far`, icon: Layers, action: () => navigate("/cards") },
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-10 py-9">
        <TopBar title={`Welcome back, ${username}`} subtitle="Here's what's in your second brain." />

        {/* --- RAG Feature: Ask Your Second Brain --- */}
        <section className="mb-8 rounded-2xl border border-[#7C3AED]/20 bg-gradient-to-br from-[#FAF5FF] via-white to-[#F5F3FF] p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
                <Sparkles size={17} />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-ink">Ask Your Second Brain (RAG Search)</h2>
                <p className="text-xs text-slate">
                  Ask any question — MongoDB semantic search finds relevant notes and AI answers using your knowledge.
                </p>
              </div>
            </div>
            {aiAnswer && (
              <button
                onClick={clearAI}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate hover:bg-black/5"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex gap-2.5">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-xs focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/10">
              <Search size={16} className="text-slate-light" />
              <input
                value={aiQuery}
                onChange={(e) => setAIQuery(e.target.value)}
                onKeyDown={handleAISearch}
                placeholder="Ask anything (e.g. What did I write about event loop or promises?)..."
                className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-light"
              />
            </div>
            <button
              onClick={() => handleAISearch()}
              disabled={aiLoading || !aiQuery.trim()}
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90 disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
              {aiLoading ? "Searching..." : "Ask AI"}
            </button>
          </div>

          {/* AI Response Display */}
          {aiLoading && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-white p-4 text-sm text-slate">
              <Loader2 size={18} className="animate-spin text-brand" />
              <span>Scanning your notes with vector search and generating answer...</span>
            </div>
          )}

          {aiError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {aiError}
            </div>
          )}

          {aiAnswer && !aiLoading && (
            <div className="mt-4 rounded-xl border border-brand/20 bg-white p-5 shadow-xs">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wide uppercase text-brand">
                <Sparkles size={14} /> AI Answer
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {aiAnswer}
              </div>

              {aiSources && aiSources.length > 0 && (
                <div className="mt-4 border-t border-line pt-3.5">
                  <span className="text-xs font-semibold text-slate">Sources matched from your notes:</span>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {aiSources.map((src) => (
                      <div
                        key={src._id}
                        onClick={() => navigate(`/board/${src._id}`)}
                        className="group flex cursor-pointer items-center justify-between rounded-lg border border-line bg-paper px-3 py-2 transition hover:border-brand/40 hover:bg-white"
                      >
                        <div className="truncate">
                          <div className="truncate text-xs font-semibold text-ink group-hover:text-brand">
                            {src.title}
                          </div>
                          {src.description && (
                            <div className="truncate text-[11px] text-slate">{src.description}</div>
                          )}
                        </div>
                        <div className="ml-2 flex shrink-0 items-center gap-1.5 font-mono text-[10px] text-brand">
                          <span>{Math.round(src.score * 100)}% match</span>
                          <ArrowRight size={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <div className="mb-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <button
                key={a.label}
                onClick={a.action}
                className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 text-left transition-shadow hover:shadow-lg"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-tint">
                  <Icon size={17} className="text-brand" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{a.label}</div>
                  <div className="mt-0.5 text-xs text-slate">{a.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Recent Cards */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">Recent cards</h2>
          <button onClick={() => navigate("/cards")} className="text-sm font-semibold text-brand">
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {recent.map((c) => (
            <CardTile key={c.id} card={c} allTags={tags} onOpen={() => navigate(`/board/${c.id}`)} />
          ))}
        </div>
      </div>

      <aside className="hidden h-full w-[300px] shrink-0 overflow-y-auto border-l border-line bg-white px-6 py-9 xl:block">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-ink">Shared links</h2>
          <button onClick={() => navigate("/links")} className="text-xs font-semibold text-brand">
            Manage
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {links.map((l) => {
            const card = cards.find((c) => c.id === l.cardId);
            return (
              <div key={l.id} className="rounded-xl bg-paper p-3.5">
                <span className="text-sm font-semibold text-ink">
                  {l.targetType === "brain" ? "Entire brain" : card?.title}
                </span>
                <div className="mt-1 text-xs text-slate">
                  {l.targetType === "card" ? "Card" : "Brain"} &middot; {l.permission === "view" ? "View only" : "Can edit"}
                </div>
                <div className="mt-1.5 font-mono text-xs text-brand">{l.clicks} clicks</div>
              </div>
            );
          })}
        </div>
      </aside>

      {showAddModal && (
        <CardFormModal
          initial={null}
          allTags={tags}
          onCreateTag={createTag}
          onSave={async (data) => {
            await addCard(data);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
