# Brainly — Frontend

A personal knowledge-management app: save links, notes, and tweets as cards, organize
each card's content on a freeform board (sticky notes, checklists, and rich link
embeds you can drag, resize, recolor, and connect with arrows), tag everything, and
share a single card or your whole brain via a read-only or editable link.

## Stack

Vite 8 · React 19 · TypeScript 6 · Tailwind CSS v4 · Zustand 5 · React Router 8 · lucide-react

## Getting started

```bash
npm install
npm run dev
```

Everything currently runs on in-memory mock data (`src/lib/mockData.ts`) — no backend
required to try it. See **Connecting the backend** below for what changes once the
real Express API is wired up.

## Folder structure

```
src/
├── components/
│   ├── ui/        Primitives: Button, Field/TextInput/TextArea, TagPill, Modal, BrainMark
│   ├── layout/     Sidebar, TopBar, AppShell (the authenticated-app frame)
│   ├── cards/      CardTile, TagPicker, CardFormModal
│   └── board/      NoteBlock, ChecklistBlock, EmbedBlock, ConnectionsLayer,
│                    ConnectorHandle, ResizeHandle, ColorPickerPopover,
│                    ReadOnlyBlockPreview, platformIcons
├── pages/          One component per route (see Routing below)
├── stores/         Zustand — useCardStore, useTagStore, useLinkStore
├── hooks/          useDraggable, useResizable, useConnection, useCanvasPaste
├── lib/            Pure functions, no React: colors.ts, platforms.ts, mockData.ts, id.ts
├── types/          Card, Block (discriminated union: note/checklist/embed), Tag, ShareLink
├── router/         AppRouter.tsx — the route table
├── styles/         index.css — Tailwind import + font faces + theme tokens
└── services/       Empty on purpose — see below
```

## Routing

| Path | Page | Notes |
|---|---|---|
| `/` | SignInPage | |
| `/signup` | SignUpPage | |
| `/dashboard` | DashboardPage | inside `AppShell` (has the sidebar) |
| `/cards` | AllCardsPage | supports `?tag=<id>` to arrive pre-filtered |
| `/tags` | TagsPage | |
| `/links` | SharedLinksPage | "preview as visitor" opens the real `/share/:token` route |
| `/board/:cardId` | BoardPage | the canvas |
| `/share/:token` | PublicBrainPage | public, no sidebar — what a visitor actually sees |

## Design decisions worth knowing about

- **Tags are dynamic.** `useTagStore` starts with five seed tags but `createTag(name)`
  adds new ones on the fly with an auto-assigned color from `TAG_COLOR_PALETTE`. Cards
  hold `tagIds: string[]`, not a single tag.
- **Blocks are a discriminated union** (`type: "note" | "checklist" | "embed"`) so every
  component gets full type-narrowing on `block.type` — see `src/types/block.ts`.
- **Paste-to-embed is real where it can be, honest where it can't.** YouTube gets an
  actual thumbnail (`img.youtube.com`) and a real fetched title (via `noembed.com`, a
  CORS-friendly oEmbed proxy) with a graceful fallback. X/Twitter, Instagram, LinkedIn,
  Reddit, TikTok, GitHub, Claude/ChatGPT/Gemini share links, and generic articles have
  no public CORS-open metadata API, so those get accurate URL-pattern *detection* and a
  platform-branded card, with the title derived from the URL rather than fetched. A real
  fix for rich article/tweet previews is a small backend proxy endpoint (fetch
  server-side, no CORS issue, cache the result) — natural to add once the Express
  backend is wired in.
- **Icons are generic, not brand logos.** lucide-react shipped v1.0 shortly before this
  was built and removed all trademarked brand icons (GitHub, X, Instagram, etc.) for
  licensing reasons. `components/board/platformIcons.ts` uses generic icons (Play,
  MessageSquare, Code2, ...) and leans on color + label (`lib/platforms.ts`
  `PLATFORM_META`) as the primary way to tell platforms apart. If real brand logos
  matter later, `simple-icons` is the current recommended replacement.
- **`lib/` stays React-free on principle.** Platform detection and color palettes are
  plain functions/data so they're trivially testable and reusable outside components.
  The platform → icon-component mapping lives in `components/board` instead, since that
  part genuinely needs React.

## Connecting the backend (next phase)

`src/services/` is intentionally empty. When it's time to wire up the real Express API:

1. Add `src/services/api.ts` (fetch wrapper with the base URL + auth header).
2. Replace each store's mock-data initial state and actions with calls into
   `services/`, keeping the store's public interface (the functions components
   already call) the same — components shouldn't need to change.
3. `types/` already mirrors the backend's shapes closely (`ShareLink` matches
   `LinkInput`, etc.) so the mapping should mostly be a rename, not a redesign.
4. Add real auth: a token in `SignInPage`/`SignUpPage`'s success path, an auth store,
   and a route guard around the `AppShell` routes.
