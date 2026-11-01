import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Pencil, Share2, Trash2, StickyNote, ListChecks, Link2 } from "lucide-react";
import { useCardStore } from "@/stores/useCardStore";
import { useTagStore } from "@/stores/useTagStore";
import { useLinkStore } from "@/stores/useLinkStore";
import { useDraggable } from "@/hooks/useDraggable";
import { useResizable } from "@/hooks/useResizable";
import { useConnection } from "@/hooks/useConnection";
import { useCanvasPaste } from "@/hooks/useCanvasPaste";
import { NoteBlock, ChecklistBlock, EmbedBlock, ConnectionsLayer } from "@/components/board";
import { Button, TagPill } from "@/components/ui";
import { CardFormModal } from "@/components/cards";
import type { ChangeEvent } from "react";
import type { Block, Tag } from "@/types";

export default function BoardPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();

  const card = useCardStore((s) => s.cards.find((c) => c.id === cardId));
  const fetchCards = useCardStore((s) => s.fetchCards);
  const deleteCard = useCardStore((s) => s.deleteCard);
  const moveBlock = useCardStore((s) => s.moveBlock);
  const resizeBlock = useCardStore((s) => s.resizeBlock);
  const addConnection = useCardStore((s) => s.addConnection);
  const deleteConnection = useCardStore((s) => s.deleteConnection);
  const addBlock = useCardStore((s) => s.addBlock);
  const deleteBlock = useCardStore((s) => s.deleteBlock);
  const changeNoteText = useCardStore((s) => s.changeNoteText);
  const changeBlockColor = useCardStore((s) => s.changeBlockColor);
  const toggleChecklistItem = useCardStore((s) => s.toggleChecklistItem);
  const editChecklistItemText = useCardStore((s) => s.editChecklistItemText);
  const addChecklistItem = useCardStore((s) => s.addChecklistItem);
  const deleteChecklistItem = useCardStore((s) => s.deleteChecklistItem);
  const changeEmbedTitle = useCardStore((s) => s.changeEmbedTitle);
  const changeEmbedUrl = useCardStore((s) => s.changeEmbedUrl);
  const pasteOntoBoard = useCardStore((s) => s.pasteOntoBoard);
  const updateCardTitle = useCardStore((s) => s.updateCardTitle);
  const updateCardMeta = useCardStore((s) => s.updateCardMeta);

  const tags = useTagStore((s) => s.tags);
  const createTag = useTagStore((s) => s.createTag);
  const createLink = useLinkStore((s) => s.createLink);

  const [zoom, setZoom] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const startDrag = useDraggable(
    zoom,
    (id, x, y) => card && moveBlock(card.id, id, x, y),
    () => {}
  );
  const startResize = useResizable(
    zoom,
    (id, w, h) => card && resizeBlock(card.id, id, w, h),
    () => {}
  );
  const { drawingFrom, drawPos, setHovered, startConnection } = useConnection(zoom, surfaceRef, (from, to) => {
    if (card) addConnection(card.id, from, to);
  });

  useCanvasPaste((text) => {
    if (card) pasteOntoBoard(card.id, text);
  });

  useEffect(() => {
    if (!card) {
      fetchCards();
    }
  }, [card, fetchCards]);

  if (!card) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-slate">Card not found.</p>
      </div>
    );
  }

  const cardTags = card.tagIds.map((id) => tags.find((t) => t.id === id)).filter((t): t is Tag => Boolean(t));
  const lastEdit = card.history[card.history.length - 1];

  function handleDelete() {
    if (!card) return;
    deleteCard(card.id);
    navigate("/cards");
  }

  function handleShare() {
    if (!card) return;
    createLink(card.id, "view");
    navigate("/links");
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <button onClick={() => navigate("/cards")} className="shrink-0 rounded-lg p-1.5 hover:bg-gray-100">
            <ArrowLeft size={16} className="text-slate" />
          </button>
          <span className="h-6 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cardTags[0]?.color ?? "#A6A3B0" }} />
          <input
            value={card.title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateCardTitle(card.id, e.target.value)}
            className="min-w-0 bg-transparent font-display text-lg font-bold text-ink outline-none"
          />
          <div className="flex flex-wrap gap-1">
            {cardTags.map((t) => (
              <TagPill key={t.id} tag={t} />
            ))}
          </div>
          <span className="hidden font-mono text-[11px] text-slate-light md:inline">edited {lastEdit.at}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => setShowEditModal(true)} className="rounded-lg p-1.5 hover:bg-gray-100" title="Edit details">
            <Pencil size={14} className="text-slate" />
          </button>
          <Button variant="ghost" onClick={handleShare}>
            <Share2 size={13} /> Share
          </Button>
          <Button variant="ghost" danger onClick={handleDelete}>
            <Trash2 size={13} /> Delete
          </Button>
        </div>
      </div>

      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex w-14 shrink-0 flex-col items-center gap-2 bg-[#1F1B2E] py-4">
          <button
            onClick={() => addBlock(card.id, "note")}
            title="Add sticky note"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <StickyNote size={17} color="white" />
          </button>
          <button
            onClick={() => addBlock(card.id, "checklist")}
            title="Add checklist"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <ListChecks size={17} color="white" />
          </button>
          <button
            onClick={() => addBlock(card.id, "link")}
            title="Add link"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10"
          >
            <Link2 size={17} color="white" />
          </button>
          <div className="my-1 h-px w-6 bg-white/15" />
          <div className="px-1 text-center text-white/40" style={{ fontSize: 9, lineHeight: 1.3 }}>
            Paste a link or text onto the board
          </div>
        </div>

        <div className="relative flex-1 overflow-auto bg-[#FBFAF8]">
          <div
            ref={surfaceRef}
            className="relative"
            style={{
              width: 2200,
              height: 1500,
              transform: `scale(${zoom})`,
              transformOrigin: "0 0",
              backgroundImage: "radial-gradient(circle, #DEDAE8 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            <ConnectionsLayer
              connections={card.connections}
              blocks={card.blocks}
              drawingFrom={drawingFrom}
              drawPos={drawPos}
              onDeleteConnection={(id) => deleteConnection(card.id, id)}
            />
            {card.blocks.length === 0 && (
              <div className="absolute text-sm text-slate-light" style={{ left: 40, top: 40 }}>
                Empty board. Add a block from the left, or paste a link or some text anywhere on the canvas.
              </div>
            )}
            {card.blocks.map((b: Block) => {
              if (b.type === "note") {
                return (
                  <NoteBlock
                    key={b.id}
                    block={b}
                    onDragStart={startDrag}
                    onResizeStart={startResize}
                    onDelete={(id) => deleteBlock(card.id, id)}
                    onChangeText={(id, text) => changeNoteText(card.id, id, text)}
                    onChangeColor={(id, color) => changeBlockColor(card.id, id, color)}
                    onStartConnection={startConnection}
                    onHoverBlock={setHovered}
                  />
                );
              }
              if (b.type === "checklist") {
                return (
                  <ChecklistBlock
                    key={b.id}
                    block={b}
                    onDragStart={startDrag}
                    onResizeStart={startResize}
                    onDelete={(id) => deleteBlock(card.id, id)}
                    onToggle={(blockId, itemId) => toggleChecklistItem(card.id, blockId, itemId)}
                    onEditText={(blockId, itemId, text) => editChecklistItemText(card.id, blockId, itemId, text)}
                    onAddItem={(blockId) => addChecklistItem(card.id, blockId)}
                    onDeleteItem={(blockId, itemId) => deleteChecklistItem(card.id, blockId, itemId)}
                    onChangeColor={(id, color) => changeBlockColor(card.id, id, color)}
                    onStartConnection={startConnection}
                    onHoverBlock={setHovered}
                  />
                );
              }
              return (
                <EmbedBlock
                  key={b.id}
                  block={b}
                  onDragStart={startDrag}
                  onResizeStart={startResize}
                  onDelete={(id) => deleteBlock(card.id, id)}
                  onChangeTitle={(id, title) => changeEmbedTitle(card.id, id, title)}
                  onChangeUrl={(id, url) => changeEmbedUrl(card.id, id, url)}
                  onStartConnection={startConnection}
                  onHoverBlock={setHovered}
                />
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-line bg-white px-1.5 py-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-slate hover:bg-gray-100"
          >
            -
          </button>
          <span className="w-10 text-center font-mono text-xs text-slate">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(1)))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sm font-semibold text-slate hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {showEditModal && (
        <CardFormModal
          initial={card}
          allTags={tags}
          onCreateTag={createTag}
          onSave={(data) => {
            updateCardMeta(card.id, data);
            setShowEditModal(false);
          }}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
